import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthTokensDto {
  @ApiProperty({ description: 'Access token (15dk)' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token (7gün)' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access token süresi (saniye)' })
  expiresIn!: number;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['admin', 'editor'] })
  role!: Role;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
