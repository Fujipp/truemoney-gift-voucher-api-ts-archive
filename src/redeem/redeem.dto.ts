// src/redeem/redeem.dto.ts
import { IsString, Matches, IsOptional, MaxLength } from 'class-validator';

export class RedeemDto {
  @IsString()
  @Matches(/^0\d{8,9}$/) // 0 ตามด้วย 9-10 หลัก
  phone!: string;

  @IsString()
  @Matches(/^https:\/\/gift\.truemoney\.com\/campaign\/\?v=[A-Za-z0-9_-]+$/)
  gift_url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  idempotencyKey?: string;
}
