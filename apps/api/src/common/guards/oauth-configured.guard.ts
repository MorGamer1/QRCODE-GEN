import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
  mixin,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvSchema } from '../config/env.validation';

/**
 * Guards an OAuth initiate/callback route, returning a clear 501 instead of a
 * confusing passport error when the operator hasn't configured that
 * provider's client id/secret - OAuth is optional for a self-hosted deploy.
 */
export function OAuthConfiguredGuard(
  provider: 'google' | 'github',
): new (...args: never[]) => CanActivate {
  @Injectable()
  class OAuthConfiguredGuardMixin implements CanActivate {
    constructor(private readonly config: ConfigService<EnvSchema, true>) {}

    canActivate(_context: ExecutionContext): boolean {
      const key = provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID';
      const configured = Boolean(this.config.get(key, { infer: true }));
      if (!configured) {
        throw new NotImplementedException(
          `${provider} sign-in is not configured on this server. See docs/DEPLOYMENT.md.`,
        );
      }
      return true;
    }
  }
  return mixin(OAuthConfiguredGuardMixin);
}
