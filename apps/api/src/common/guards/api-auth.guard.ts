import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

/**
 * Global auth guard: honors @Public(), then accepts either an `X-API-Key`
 * header (for programmatic REST API access) or the normal JWT
 * session (cookie or Bearer token, via the passport 'jwt' strategy) -
 * everything under /api is reachable through both, documented in Swagger
 * via the two security schemes registered in main.ts.
 */
@Injectable()
export class ApiAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeysService: ApiKeysService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      const user = await this.apiKeysService.validate(apiKey);
      if (!user) throw new UnauthorizedException('Invalid or expired API key');
      (request as Request & { user: typeof user }).user = user;
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
