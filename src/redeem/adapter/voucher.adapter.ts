export interface VoucherAdapter {
  checkVoucher(giftUrl: string): Promise<{ valid: boolean; issuer?: string; remaining?: number }>;
  redeem(params: { phone: string; giftUrl: string }): Promise<{ amount: number; currency: string; issuer?: string; reference?: string }>;
}
