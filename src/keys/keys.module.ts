import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { PrismaModule } from '../db/prisma.module';
import { KeysController } from './keys.controller';

@Module({
  imports: [PrismaModule],
  providers: [KeysService],
  controllers: [KeysController],
  exports: [KeysService],
})
export class KeysModule {}
