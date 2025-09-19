// src/keys/cli/keys.create.command.ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { KeysService } from '../keys.service';

@Command({ name: 'keys:create', description: 'Create API key' })
export class KeysCreateCommand extends CommandRunner {
  constructor(private svc: KeysService) { super(); }

  async run(passedParams: string[], opts?: Record<string, any>): Promise<void> {
    const o = opts ?? {}; // ✅ กัน undefined
    const clientId = o.client ?? passedParams[0];
    if (!clientId) throw new Error('--client <id> required');

    const ttlDays = o.ttl ? parseInt(String(o.ttl), 10) : undefined;
    const res = await this.svc.createKey(clientId, 'ak_live', ['redeem:create'], ttlDays);

    console.log('KEY CREATED');
    console.log('keyId:', res.keyId);
    console.log('fullKey (save now):', res.fullKey);
    console.log('expiresAt:', res.expiresAt ?? 'none');
  }

  @Option({ flags: '--client <clientId>' })
  parseClient(val: string): string { return val; } // ✅ @Option ต้องอยู่บน "เมธอด" และ return ค่า

  @Option({ flags: '--ttl <days>' })
  parseTTL(val: string): string { return val; }    // ✅ เช่นเดียวกัน
}
