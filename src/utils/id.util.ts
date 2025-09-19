import { randomBytes } from 'crypto';

export function genReadableId(prefix: string) {
  const rnd = randomBytes(6).toString('hex'); // 12 chars
  return `${prefix}_${rnd}`;
}

export function splitApiKey(full: string) {
  // รูป: ak_live_<publicPart>.<secretPart>
  const [lhs, secretPart] = full.split('.');
  return { keyId: lhs, secretPart };
}
