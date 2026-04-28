import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export type SafeUser = Omit<User, 'passwordHash'>;

interface CreateUserInput {
  email: string;
  password: string;
  role?: Role;
}

interface UpdateUserInput {
  email?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(this.stripPassword);
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.stripPassword(user);
  }

  /** Şifre dahil tam user — sadece auth doğrulama için kullanılmalı. */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(input: CreateUserInput): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException(`Email ${input.email} already in use`);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role ?? Role.editor,
      },
    });
    return this.stripPassword(created);
  }

  async update(id: string, input: UpdateUserInput): Promise<SafeUser> {
    await this.findById(id);

    const data: Record<string, string | boolean | Role> = {};
    if (input.email) data.email = input.email;
    if (input.role) data.role = input.role;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);

    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.stripPassword(updated);
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  private stripPassword(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...rest } = user;
    void _passwordHash;
    return rest;
  }
}
