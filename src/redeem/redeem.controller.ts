import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/auth.guard';  // << ใช้ไฟล์ใหม่
import { RedeemService } from './redeem.service';
import { RedeemDto } from './redeem.dto';

@Controller('v1')
export class RedeemController {
  constructor(private svc: RedeemService) {}

  @UseGuards(ApiKeyGuard)
  @Post('redeem')
  async redeem(@Req() req: any, @Body() body: RedeemDto) {
    const apiKey = req.apiKey; // มาจาก Guard
    return this.svc.redeem(apiKey.clientId, apiKey.id, body);
  }
}
