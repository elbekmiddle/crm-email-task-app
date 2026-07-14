import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InboundEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  from: string;

  @ApiProperty({ example: 'sales@acme.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Need a quote for 100 licenses' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject: string;

  @ApiProperty({ example: 'Please send me pricing before Friday' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  body: string;
}
