import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { KeysService } from './keys.service';

@Controller('internal/keys')
export class KeysController {
  constructor(private svc: KeysService) {}

  @Post()
  async create(@Body() dto: { clientId: string; ttlDays?: number }) {
    return this.svc.createKey(dto.clientId, 'ak_live', ['redeem:create'], dto.ttlDays);
  }

  @Get(':clientId')
  list(@Param('clientId') clientId: string) {
    return this.svc.listKeys(clientId);
  }

  @Post(':keyId/revoke')
  revoke(@Param('keyId') keyId: string) {
    return this.svc.revoke(keyId);
  }
}
