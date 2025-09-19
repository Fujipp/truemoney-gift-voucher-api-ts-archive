import { Command, CommandRunner, Option } from 'nest-commander';
import { KeysService } from '../keys.service';

@Command({ name: 'keys:rotate', arguments: '<keyId>' })
export class KeysRotateCommand extends CommandRunner {
  constructor(private svc: KeysService) { super(); }
  async run([keyId]: string[], opts: any) {
    const ttlDays = opts.ttl ? parseInt(opts.ttl, 10) : undefined;
    const res = await this.svc.rotate(keyId, ttlDays);
    console.log('ROTATED\nnew keyId:', res.keyId, '\nfullKey (save now):', res.fullKey);
  }
  @Option({ flags: '--ttl <days>' }) parseTTL(v: string) { return v; }
}
