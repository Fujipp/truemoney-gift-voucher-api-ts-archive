import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { sha256Hex } from '../common/crypto.util';
import { VoucherMock } from './adapter/voucher.mock';
import { VoucherTrueWallet } from './adapter/voucher.truewallet';

@Injectable()
export class RedeemService {
//   private adapter = new VoucherMock(); // ภายหลังสลับเป็น lib จริงได้
  private adapter = new VoucherTrueWallet();

  constructor(private prisma: PrismaService) {}

  async redeem(clientId: string, apiKeyId: string, body: { phone: string; gift_url: string; idempotencyKey?: string }) {
    if (!body.phone || !body.gift_url) throw new BadRequestException('phone and gift_url required');
    const giftUrlHash = sha256Hex(body.gift_url);

    // idempotency guard
    if (body.idempotencyKey) {
      const exist = await this.prisma.redeemJob.findUnique({ where: { clientId_idempotencyKey: { clientId, idempotencyKey: body.idempotencyKey } } as any });
      if (exist) return exist;
    }

    const job = await this.prisma.redeemJob.create({
      data: { clientId, apiKeyId, phone: body.phone, giftUrlHash, status: 'CREATED', idempotencyKey: body.idempotencyKey },
    });

    try {
      await this.prisma.redeemJob.update({ where: { id: job.id }, data: { status: 'VERIFYING' } });
      const ck = await this.adapter.checkVoucher(body.gift_url);
      if (!ck.valid) {
        return await this.prisma.redeemJob.update({ where: { id: job.id }, data: { status: 'VERIFY_FAILED', failCode: 'VOUCHER_INVALID', failReason: 'not valid' } });
      }

      await this.prisma.redeemJob.update({ where: { id: job.id }, data: { status: 'REDEEMING' } });
      const res = await this.adapter.redeem({ phone: body.phone, giftUrl: body.gift_url });

      return await this.prisma.redeemJob.update({
        where: { id: job.id },
        data: { status: 'SUCCEEDED', amount: res.amount, currency: res.currency, issuer: res.issuer },
      });
    } catch (e: any) {
    const code = e?.code || 'UPSTREAM';
    const reason = String(e?.message ?? e);
    const data = { status: code === 'VOUCHER_INVALID' ? 'VERIFY_FAILED' : 'REDEEM_FAILED',
                    failCode: code, failReason: reason };
    return await this.prisma.redeemJob.update({ where: { id: job.id }, data });
    }
  }
}
