import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'editor@krontech.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, description: 'En az 8 karakter' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.editor })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
