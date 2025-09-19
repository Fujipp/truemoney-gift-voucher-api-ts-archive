import { Command, CommandRunner } from 'nest-commander';
import { KeysService } from '../keys.service';

@Command({ name: 'keys:revoke', arguments: '<keyId>' })
export class KeysRevokeCommand extends CommandRunner {
  constructor(private svc: KeysService) { super(); }
  async run([keyId]: string[]) {
    await this.svc.revoke(keyId);
    console.log('revoked:', keyId);
  }
}
