import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import {
  ALL_PERMISSIONS_KEY,
  ANY_PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredAll = this.reflector.getAllAndOverride<string[]>(
      ALL_PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    const requiredAny = this.reflector.getAllAndOverride<string[]>(
      ANY_PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (
      (!requiredAll || requiredAll.length === 0) &&
      (!requiredAny || requiredAny.length === 0)
    ) {
      return true;
    }

    const { user } = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const userPermissions = user?.permissions ?? [];
    const hasAll =
      !requiredAll ||
      requiredAll.every((permission) => userPermissions.includes(permission));
    const hasAny =
      !requiredAny ||
      requiredAny.some((permission) => userPermissions.includes(permission));

    if (!hasAll || !hasAny) {
      throw new ForbiddenException('Permissão insuficiente');
    }

    return true;
  }
}
