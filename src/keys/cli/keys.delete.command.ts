import { Command, CommandRunner } from 'nest-commander';
import { KeysService } from '../keys.service';

@Command({ name: 'keys:delete', arguments: '<keyId>' })
export class KeysDeleteCommand extends CommandRunner {
  constructor(private svc: KeysService) { super(); }
  async run([keyId]: string[]) {
    await this.svc.hardDelete(keyId);
    console.log('deleted:', keyId);
  }
}
