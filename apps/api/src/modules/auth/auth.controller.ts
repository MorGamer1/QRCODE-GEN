import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { EnvSchema } from '../../common/config/env.validation';
import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { OAuthConfiguredGuard } from '../../common/guards/oauth-configured.guard';
import { SettingsService } from '../../common/settings/settings.service';
import { RATE_LIMIT } from '@qrgen/shared';
import { AuthService } from './auth.service';
import type { IssuedTokens } from './token.service';
import {
  ChangePasswordDto,
  Disable2faDto,
  Enable2faVerifyDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE = 'access_token';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvSchema, true>,
    private readonly settings: SettingsService,
  ) {}

  /** Public, unauthenticated capability probe so the web app can hide register/OAuth UI it can't use. */
  @Public()
  @Get('config')
  async authConfig() {
    const settings = await this.settings.get();
    return {
      allowPublicRegistration: settings.allowPublicRegistration,
      requireEmailVerification: settings.requireEmailVerification,
      oauth: {
        google: Boolean(this.config.get('GOOGLE_CLIENT_ID', { infer: true })),
        github: Boolean(this.config.get('GITHUB_CLIENT_ID', { infer: true })),
      },
    };
  }

  private setSessionCookies(res: Response, tokens: IssuedTokens): void {
    const secure = this.config.get('NODE_ENV', { infer: true }) === 'production';
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: tokens.accessTokenTtlMs,
      path: '/',
    });
    // path '/' (not scoped to /auth) so the Next.js middleware can read cookie *presence*
    // for route-guarding without ever seeing the token value - it stays httpOnly/secure.
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: tokens.refreshTokenTtlMs,
      path: '/',
    });
  }

  private clearSessionCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  private meta(req: Request) {
    return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  }

  @Public()
  @RateLimit(RATE_LIMIT.AUTH)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, this.meta(req));
    if (result.tokens) this.setSessionCookies(res, result.tokens);
    return {
      user: result.user,
      requiresEmailVerification: result.requiresEmailVerification,
      ...(result.tokens ? { accessToken: result.tokens.accessToken } : {}),
    };
  }

  @Public()
  @RateLimit(RATE_LIMIT.AUTH)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.meta(req));
    if (result.status === 'twoFactorRequired') return { twoFactorRequired: true };
    this.setSessionCookies(res, result.tokens);
    return { user: result.user, accessToken: result.tokens.accessToken };
  }

  @Public()
  @RateLimit(RATE_LIMIT.AUTH)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!presented) throw new UnauthorizedException('No refresh token presented');
    const tokens = await this.authService.refresh(presented, this.meta(req));
    this.setSessionCookies(res, tokens);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(presented);
    this.clearSessionCookies(res);
    return { success: true };
  }

  @Public()
  @RateLimit(RATE_LIMIT.AUTH)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { success: true };
  }

  @Public()
  @RateLimit(RATE_LIMIT.AUTH)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { success: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: RequestUser, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    return user;
  }

  @Post('2fa/setup')
  async setupTwoFactor(@CurrentUser() user: RequestUser) {
    return this.authService.setupTwoFactor(user.id);
  }

  @Post('2fa/enable')
  async enableTwoFactor(@CurrentUser() user: RequestUser, @Body() dto: Enable2faVerifyDto) {
    return this.authService.enableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(@CurrentUser() user: RequestUser, @Body() dto: Disable2faDto) {
    await this.authService.disableTwoFactor(user.id, dto.password, dto.code);
    return { success: true };
  }

  @Public()
  @UseGuards(OAuthConfiguredGuard('google'), AuthGuard('google'))
  @Get('google')
  googleAuth() {
    // Passport redirects to Google's consent screen; nothing to do here.
  }

  @Public()
  @UseGuards(OAuthConfiguredGuard('google'), AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { id: string };
    const tokens = await this.authService.issueSessionForUser(user.id, this.meta(req));
    this.setSessionCookies(res, tokens);
    res.redirect(`${this.config.get('WEB_BASE_URL', { infer: true }).split(',')[0]}/dashboard`);
  }

  @Public()
  @UseGuards(OAuthConfiguredGuard('github'), AuthGuard('github'))
  @Get('github')
  githubAuth() {
    // Passport redirects to GitHub's consent screen; nothing to do here.
  }

  @Public()
  @UseGuards(OAuthConfiguredGuard('github'), AuthGuard('github'))
  @Get('github/callback')
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { id: string };
    const tokens = await this.authService.issueSessionForUser(user.id, this.meta(req));
    this.setSessionCookies(res, tokens);
    res.redirect(`${this.config.get('WEB_BASE_URL', { infer: true }).split(',')[0]}/dashboard`);
  }
}
