import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { aesGcmEncrypt } from '../common/crypto.util';
import { genReadableId } from '../utils/id.util';

// ...imports คงเดิม
@Injectable()
export class KeysService {
  constructor(private prisma: PrismaService) {}

  async createKey(clientId: string, prefix = 'ak_live', scopes: string[] = ['redeem:create'], ttlDays?: number) {
    const keyId = genReadableId(prefix);
    const secretPlain = randomBytes(32);
    const secretHash = await argon2.hash(secretPlain.toString('base64url'), { type: argon2.argon2id });
    const master = Buffer.from(process.env.MASTER_KEY!, /==|=|-/i.test(process.env.MASTER_KEY!) ? 'base64' : 'hex');
    const secretEncrypted = aesGcmEncrypt(master, secretPlain);
    const expiresAt = ttlDays ? new Date(Date.now() + ttlDays * 86400_000) : null;

    const rec = await this.prisma.apiKey.create({
      data: {
        id: keyId,
        clientId,
        prefix,
        secretHash,
        secretEncrypted,
        scopes: JSON.stringify(scopes),   // ✅ เก็บเป็นสตริง
        expiresAt,
      },
    });

    const fullKey = `${keyId}.${secretPlain.toString('base64url')}`;
    return { keyId: rec.id, fullKey, expiresAt };
  }

  async listKeys(clientId?: string) {
    const rows = await this.prisma.apiKey.findMany({
      where: { clientId: clientId ?? undefined },
      select: {
        id: true, clientId: true, status: true, expiresAt: true,
        lastUsedAt: true, rateLimitPerMin: true, scopes: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' },
    });

    // (optional) parse scopes เพื่อโชว์สวย ๆ
    return rows.map(r => ({
      ...r,
      scopes: (() => { try { return JSON.parse(r.scopes as unknown as string); } catch { return r.scopes; } })(),
    }));
  }

  async revoke(keyId: string) {
    return this.prisma.apiKey.update({ where: { id: keyId }, data: { status: 'REVOKED' } }); // ✅ status เป็น string
  }

  async hardDelete(keyId: string) {
    return this.prisma.apiKey.delete({ where: { id: keyId } });
  }

  async rotate(keyId: string, ttlDays?: number) {
    const old = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!old) throw new Error('not found');
    await this.revoke(keyId);
    // old.scopes เป็น string → แปลงกลับเป็น array
    let scopes: string[] = ['redeem:create'];
    try { scopes = JSON.parse((old.scopes as unknown as string) ?? '["redeem:create"]'); } catch {}
    return this.createKey(old.clientId, old.prefix, scopes, ttlDays);
  }
}
