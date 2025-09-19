// src/redeem/adapter/voucher.truewallet.ts
export interface VoucherAdapter {
  checkVoucher(giftUrl: string, phone?: string): Promise<{ valid: boolean; issuer?: string; remaining?: number }>;
  redeem(args: { phone: string; giftUrl: string }): Promise<{ amount: number; currency: string; issuer?: string; reference?: string }>;
}

function parseLinkFromGiftUrl(giftUrl: string): string {
  const u = new URL(giftUrl);
  const v = u.searchParams.get('v');
  if (!v) throw new Error('Invalid gift_url: missing v param');
  return v;
}

function msTimeoutAbort(ms: number) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, done: () => clearTimeout(id) };
}

export class VoucherTrueWallet implements VoucherAdapter {
//   private readonly cookie = process.env.TW_AUTH_COOKIE || ''; 
  private readonly ua = process.env.TW_USER_AGENT || 'tmn-redeemer/1.0';
  private readonly timeout = parseInt(process.env.TW_TIMEOUT_MS ?? '12000', 10);

  async checkVoucher(giftUrl: string, phone?: string) {
    const link = parseLinkFromGiftUrl(giftUrl);
    const qs = phone ? `?mobile=${encodeURIComponent(phone)}` : '';
    const url = `https://gift.truemoney.com/campaign/vouchers/${link}/verify${qs}`;

    const { signal, done } = msTimeoutAbort(this.timeout);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.ua,
        //   ...(this.cookie ? { 'Cookie': this.cookie } : {}),
          'Accept': 'application/json, text/plain, */*'
        },
        signal
      });
      if (!res.ok) throw new Error(`TW_VERIFY_HTTP_${res.status}`);
      const j = await res.json();

      // ยึดตามรูปที่คุณให้มา
      const v = j?.data?.voucher;
      const owner = j?.data?.owner_profile?.full_name;
      const remaining = typeof v?.available === 'number' ? v.available : undefined;

      return { valid: j?.status?.code === 'SUCCESS' && v?.status === 'active', issuer: owner, remaining };
    } finally {
      done();
    }
  }

  async redeem({ phone, giftUrl }: { phone: string; giftUrl: string }) {
    const link = parseLinkFromGiftUrl(giftUrl);
    const verifyUrl = `https://gift.truemoney.com/campaign/vouchers/${link}/verify?mobile=${encodeURIComponent(phone)}`;
    const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${link}/redeem`;

    // 1) verify + ผูกเบอร์ (ตามตัวอย่างที่คุณให้มา)
    await this.#fetchJson(verifyUrl, { method: 'GET' });

    // 2) redeem
    // บางรอบไม่ต้องส่ง body แต่เพื่อความชัดเจนส่ง mobile ไปด้วย
    const j = await this.#fetchJson(redeemUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: phone })
    });

    // แปลงผลลัพธ์ตามรูป JSON ที่คุณให้
    const v = j?.data?.voucher;
    const ticket = j?.data?.my_ticket;
    const owner = j?.data?.owner_profile?.full_name;
    const amountStr = v?.redeemed_amount_baht ?? v?.amount_baht;
    const amount = amountStr ? Number(amountStr) : 0;

    // ใช้เวลาล่าสุดเป็น reference คร่าว ๆ (ถ้าไม่มีฟิลด์เฉพาะ)
    const reference = String(v?.voucher_id ?? ticket?.update_date ?? '');

    return { amount, currency: 'THB', issuer: owner, reference };
  }

  // helper
  async #fetchJson(url: string, init: RequestInit) {
    const { signal, done } = msTimeoutAbort(this.timeout);
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          'User-Agent': this.ua,
        //   ...(this.cookie ? { 'Cookie': this.cookie } : {}),
          ...(init.headers || {}),
          'Accept': 'application/json, text/plain, */*'
        },
        signal
      });
      if (!res.ok) {
        if (res.status === 429) throw Object.assign(new Error('UPSTREAM_RATE_LIMIT'), { code: 'UPSTREAM_RATE_LIMIT' });
        if (res.status === 401 || res.status === 403) throw Object.assign(new Error('UPSTREAM_AUTH'), { code: 'UPSTREAM_AUTH' });
        throw Object.assign(new Error(`UPSTREAM_${res.status}`), { code: 'UPSTREAM' });
      }
      const j = await res.json().catch(() => ({}));
      if (j?.status?.code !== 'SUCCESS') {
        throw Object.assign(new Error(j?.status?.message || 'VOUCHER_INVALID'), { code: 'VOUCHER_INVALID', meta: j });
      }
      return j;
    } catch (e: any) {
      if (e?.name === 'AbortError') throw Object.assign(new Error('UPSTREAM_TIMEOUT'), { code: 'UPSTREAM_TIMEOUT' });
      throw e;
    } finally {
      done();
    }
  }
}
