import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import type { EnvSchema } from '../../../common/config/env.validation';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService<EnvSchema, true>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID', { infer: true }) || 'disabled',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET', { infer: true }) || 'disabled',
      callbackURL:
        config.get('GOOGLE_CALLBACK_URL', { infer: true }) ||
        `${config.get('PUBLIC_BASE_URL', { infer: true })}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account has no accessible email address'), undefined);
      return;
    }
    const user = await this.authService.findOrCreateOAuthUser({
      provider: 'google',
      providerAccountId: profile.id,
      email,
      name: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value,
    });
    done(null, user);
  }
}
