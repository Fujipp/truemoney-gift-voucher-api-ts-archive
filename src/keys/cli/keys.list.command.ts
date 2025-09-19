import { Command, CommandRunner, Option } from 'nest-commander';
import { KeysService } from '../keys.service';

@Command({ name: 'keys:list', description: 'List API keys' })
export class KeysListCommand extends CommandRunner {
  constructor(private svc: KeysService) { super(); }
  async run(_: string[], opts: any) {
    const rows = await this.svc.listKeys(opts.client);
    console.table(rows);
  }
  @Option({ flags: '--client <clientId>' }) parseClient(val: string) { return val; }
}
