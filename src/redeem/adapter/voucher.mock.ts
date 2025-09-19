import { VoucherAdapter } from './voucher.adapter';

export class VoucherMock implements VoucherAdapter {
  async checkVoucher(giftUrl: string) {
    return { valid: giftUrl.includes('campaign'), issuer: 'MockIssuer', remaining: 1 };
  }
  async redeem({ phone, giftUrl }: { phone: string; giftUrl: string }) {
    if (!giftUrl.includes('campaign')) throw new Error('Invalid gift URL');
    return { amount: 25.0, currency: 'THB', issuer: 'MockIssuer', reference: `mock-${phone.slice(-4)}` };
  }
}
