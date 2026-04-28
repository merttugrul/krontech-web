import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ScheduleProductDto {
  @ApiProperty({ description: 'Yayın zamanı (gelecekte olmalı, ISO format)' })
  @IsDateString()
  scheduledAt!: string;
}
