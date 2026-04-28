import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: Record<string, jest.Mock> };

  const buildUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'u1',
    email: 'a@b.c',
    passwordHash: 'hash',
    role: Role.editor,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('user kaydını passwordHash olmadan döner', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      const result = await service.findById('u1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('a@b.c');
    });

    it('user yoksa NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('şifreyi bcrypt ile hashler ve user oluşturur', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(buildUser(data)),
      );

      const result = await service.create({
        email: 'new@user.com',
        password: 'plainPw123',
        role: Role.admin,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@user.com',
            role: Role.admin,
          }),
        }),
      );
      // Hash'lenmiş şifre düz olandan farklı olmalı
      const callArg = prisma.user.create.mock.calls[0][0].data as { passwordHash: string };
      expect(callArg.passwordHash).not.toBe('plainPw123');
      expect(await bcrypt.compare('plainPw123', callArg.passwordHash)).toBe(true);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('email zaten varsa ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      await expect(service.create({ email: 'a@b.c', password: 'x' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('role verilmezse default editor', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(buildUser());
      await service.create({ email: 'new@user.com', password: 'pw123' });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: Role.editor }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('kullanıcı listesi passwordHash olmadan döner', async () => {
      prisma.user.findMany.mockResolvedValue([buildUser({ id: 'a' }), buildUser({ id: 'b', email: 'x@y.c' })]);
      const list = await service.findAll();
      expect(list).toHaveLength(2);
      expect(list[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('update', () => {
    it('şifre verilirse hashlenir', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.user.update.mockImplementation(
        ({ data }: { data: { passwordHash?: string; email?: string; role?: Role; isActive?: boolean } }) =>
          Promise.resolve(
            buildUser({
              email: data.email,
              role: data.role,
              isActive: data.isActive,
              passwordHash: data.passwordHash ?? 'hash',
            }),
          ),
      );

      const result = await service.update('u1', { password: 'newSecret99' });
      const call = prisma.user.update.mock.calls[0][0] as { data: { passwordHash: string } };
      expect(call.data.passwordHash).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(await bcrypt.compare('newSecret99', call.data.passwordHash)).toBe(true);
    });

    it('user yoksa NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { email: 'a@b.c' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('siler ve { id } döner', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.user.delete.mockResolvedValue(buildUser());
      const out = await service.delete('u1');
      expect(out).toEqual({ id: 'u1' });
    });

    it('yoksa NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
