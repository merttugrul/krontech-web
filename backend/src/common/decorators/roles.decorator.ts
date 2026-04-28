import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles('admin') veya @Roles('admin', 'editor')
 * RolesGuard tarafından okunur. JwtAuthGuard'tan sonra çalışır.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
