// scripts/create-keys.ts
import 'dotenv/config';
import 'reflect-metadata';
import { PrismaService } from '../src/db/prisma.service';
import { KeysService } from '../src/keys/keys.service';

async function main() {
  const args = process.argv.slice(2);
  const clientId = args[0];
  const n = parseInt(args[1] ?? '10', 10);
  const ttlDays = args[2] ? parseInt(args[2], 10) : undefined;

  if (!clientId) {
    console.error('Usage: ts-node scripts/create-keys.ts <clientId> [count=10] [ttlDays]');
    process.exit(2);
  }

  const prisma = new PrismaService();
  await prisma.$connect();
  const keysSvc = new KeysService(prisma);

  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    try {
      const res = await keysSvc.createKey(clientId, 'ak_live', ['redeem:create'], ttlDays);
      // res = { keyId, fullKey, expiresAt }
      console.log(`CREATED ${i + 1}: ${res.fullKey}`);
      out.push(res.fullKey);
      // short pause safe
      await new Promise(r => setTimeout(r, 100));
    } catch (e: any) {
      console.error(`ERROR creating key #${i + 1}:`, e?.message ?? e);
    }
  }

  await prisma.$disconnect();

  // Optionally write to file
  const fs = await import('fs');
  const path = `generated_keys_${Date.now()}.txt`;
  fs.writeFileSync(path, out.join('\n'), { mode: 0o600 });
  console.log('Saved keys to', path);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
