#!/usr/bin/env ts-node
import 'reflect-metadata';
import { CommandFactory } from 'nest-commander';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../db/prisma.module';
import { KeysService } from '../keys.service';
import { KeysCreateCommand } from './keys.create.command';
import { KeysListCommand } from './keys.list.command';
import { KeysRevokeCommand } from './keys.revoke.command';
import { KeysDeleteCommand } from './keys.delete.command';
import { KeysRotateCommand } from './keys.rotate.command';

@Module({
  imports: [PrismaModule],
  providers: [KeysService, KeysCreateCommand, KeysListCommand, KeysRevokeCommand, KeysDeleteCommand, KeysRotateCommand],
})
class KeysCliModule {}

async function bootstrap() {
  await CommandFactory.run(KeysCliModule, ['warn', 'error']);
}
bootstrap();
