import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy as GitHubStrategy } from 'passport-github2';
import type { EnvSchema } from '../../../common/config/env.validation';
import { AuthService } from '../auth.service';

interface GitHubProfile {
  id: string;
  displayName?: string;
  username?: string;
  photos?: { value: string }[];
  emails?: { value: string }[];
}

type Done = (err: Error | null, user?: unknown) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(GitHubStrategy, 'github') {
  constructor(
    config: ConfigService<EnvSchema, true>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get('GITHUB_CLIENT_ID', { infer: true }) || 'disabled',
      clientSecret: config.get('GITHUB_CLIENT_SECRET', { infer: true }) || 'disabled',
      callbackURL:
        config.get('GITHUB_CALLBACK_URL', { infer: true }) ||
        `${config.get('PUBLIC_BASE_URL', { infer: true })}/api/v1/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: Done,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(
        new Error(
          'GitHub account has no accessible email address - make your primary email public',
        ),
      );
      return;
    }
    const user = await this.authService.findOrCreateOAuthUser({
      provider: 'github',
      providerAccountId: profile.id,
      email,
      name: profile.displayName || profile.username || email,
      avatarUrl: profile.photos?.[0]?.value,
    });
    done(null, user);
  }
}
