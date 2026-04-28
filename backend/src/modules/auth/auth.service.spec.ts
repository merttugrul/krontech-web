import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// bcrypt'i module level mockluyoruz — testler deterministik + spyOn kısıtları yok.
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
import * as bcryptModule from 'bcrypt';
const bcrypt = bcryptModule as unknown as { compare: jest.Mock; hash: jest.Mock };

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<UsersService>;
  let jwt: jest.Mocked<JwtService>;
  let config: { get: jest.Mock; getOrThrow: jest.Mock };

  const buildUser = (overrides: Partial<{ isActive: boolean; role: Role }> = {}) => ({
    id: 'user-id-1',
    email: 'admin@test.local',
    passwordHash: '$2b$10$mockedhashvaluehere',
    role: overrides.role ?? Role.admin,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmailWithPassword: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    users = module.get(UsersService);
    jwt = module.get(JwtService);
    config = module.get(ConfigService) as unknown as {
      get: jest.Mock;
      getOrThrow: jest.Mock;
    };

    config.getOrThrow.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      if (!map[key]) throw new Error(`missing config: ${key}`);
      return map[key];
    });
    config.get.mockImplementation((key: string, fallback?: string) => {
      const map: Record<string, string> = {
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key] ?? fallback ?? '';
    });
  });

  describe('validateUser', () => {
    it('şifre doğruysa passwordHash olmadan user döner', async () => {
      const user = buildUser();
      users.findByEmailWithPassword.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser('admin@test.local', 'correctPw');

      expect(result).toBeTruthy();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.email).toBe(user.email);
      expect(result?.role).toBe(Role.admin);
    });

    it('kullanıcı yoksa null döner (enumeration koruması)', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);
      expect(await service.validateUser('no@one.com', 'any')).toBeNull();
    });

    it('şifre yanlışsa null döner', async () => {
      users.findByEmailWithPassword.mockResolvedValue(buildUser());
      bcrypt.compare.mockResolvedValue(false);
      expect(await service.validateUser('admin@test.local', 'wrongPw')).toBeNull();
    });

    it('isActive=false ise şifre doğru bile olsa null döner', async () => {
      users.findByEmailWithPassword.mockResolvedValue(buildUser({ isActive: false }));
      bcrypt.compare.mockResolvedValue(true);
      expect(await service.validateUser('admin@test.local', 'correctPw')).toBeNull();
    });
  });

  describe('login', () => {
    it('access ve refresh token üretip user bilgisini döner', async () => {
      jwt.signAsync.mockResolvedValueOnce('access-token-value');
      jwt.signAsync.mockResolvedValueOnce('refresh-token-value');

      const safeUser = {
        id: 'u1',
        email: 'a@b.c',
        role: Role.admin,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.login(safeUser);

      expect(result.tokens.accessToken).toBe('access-token-value');
      expect(result.tokens.refreshToken).toBe('refresh-token-value');
      expect(result.tokens.expiresIn).toBe(15 * 60);
      expect(result.user).toEqual({ id: 'u1', email: 'a@b.c', role: Role.admin });
    });

    it('access token payload type="access" içerir', async () => {
      jwt.signAsync.mockResolvedValue('tok');
      const safeUser = {
        id: 'u1',
        email: 'a@b.c',
        role: Role.editor,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await service.login(safeUser);

      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'access', sub: 'u1', role: Role.editor }),
        expect.objectContaining({ secret: 'test-access-secret' }),
      );
    });

    it('refresh token payload type="refresh" içerir', async () => {
      jwt.signAsync.mockResolvedValue('tok');
      const safeUser = {
        id: 'u1',
        email: 'a@b.c',
        role: Role.admin,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await service.login(safeUser);

      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'refresh', sub: 'u1' }),
        expect.objectContaining({ secret: 'test-refresh-secret' }),
      );
    });
  });

  describe('refresh', () => {
    it('geçerli refresh token ile yeni token üretir', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', type: 'refresh' });
      users.findById.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        role: Role.admin,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwt.signAsync.mockResolvedValue('new-token');

      const result = await service.refresh('some-refresh-token');

      expect(result.tokens.accessToken).toBe('new-token');
      expect(result.user.id).toBe('u1');
    });

    it('geçersiz token → UnauthorizedException', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refresh('bad')).rejects.toThrow(UnauthorizedException);
    });

    it('type=access ile refresh yapılırsa UnauthorizedException', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', type: 'access' });
      await expect(service.refresh('access-token')).rejects.toThrow(UnauthorizedException);
    });

    it('isActive=false user ile refresh yapılırsa UnauthorizedException', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', type: 'refresh' });
      users.findById.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        role: Role.admin,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
