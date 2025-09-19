import { Module } from '@nestjs/common';
import { RedeemController } from './redeem.controller';
import { RedeemService } from './redeem.service';
import { PrismaModule } from '../db/prisma.module';
import { ApiKeyGuard } from '../common/auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [RedeemController],
  providers: [RedeemService, ApiKeyGuard],
})
export class RedeemModule {}
