import { createHmac } from 'crypto';

export function hmacHexSHA256(secret: Buffer | string, msg: string | Buffer) {
  return createHmac('sha256', secret).update(msg).digest('hex');
}

/** สร้าง message สำหรับเซ็น: METHOD\nPATH\nTIMESTAMP\nBODY */
export function signMessage(method: string, path: string, timestamp: string, body: any) {
  const bodyStr = body ? JSON.stringify(body) : '';
  return [method.toUpperCase(), path, timestamp, bodyStr].join('\n');
}
