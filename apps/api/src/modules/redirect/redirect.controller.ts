import { Body, Controller, Get, Param, Post, Req, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import {
  ContentType,
  encodeEmail,
  encodeEvent,
  encodePhone,
  encodeSms,
  encodeVCard,
  encodeWhatsapp,
  encodeWifi,
  isInstantRedirect,
  parseQrDesign,
  resolveAppStoreUrlForPlatform,
  validateContentPayload,
  type ContentPayloadMap,
} from '@qrgen/shared';
import { buildQrScene, renderSceneToSvg } from '@qrgen/qr-engine';
import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import type { EnvSchema } from '../../common/config/env.validation';
import type { CachedRedirectEntry } from '../../common/redirect-cache/redirect-cache.service';
import { FilesService } from '../files/files.service';
import { RedirectService } from './redirect.service';
import { resolveSmartRedirect } from './rule-matcher';
import {
  cryptoPage,
  customPage,
  errorPage,
  eventPage,
  locationPage,
  mediaPage,
  passwordPromptPage,
  socialPage,
  textPage,
  vcardPage,
  wifiPage,
} from './landing-pages';

type Platform = 'ios' | 'android' | 'desktop' | 'other';

function detectPlatform(osName: string | undefined, deviceType: string | undefined): Platform {
  const name = (osName ?? '').toLowerCase();
  if (name.includes('ios')) return 'ios';
  if (name.includes('android')) return 'android';
  if (!deviceType) return 'desktop';
  return 'other';
}

function getClientIp(req: Request): string | undefined {
  return req.ip;
}

const UNAVAILABLE_MESSAGES: Record<string, [string, string]> = {
  expired: ['This link has expired', 'The owner of this QR code has set it to expire.'],
  'not-yet-active': ['Not active yet', 'This QR code is scheduled to activate later.'],
  deactivated: ['No longer active', 'This QR code has been deactivated by its owner.'],
  'scan-limit': ['Scan limit reached', 'This QR code has reached its maximum number of scans.'],
};

@ApiExcludeController()
@Public()
@Controller({ path: 'r', version: VERSION_NEUTRAL })
export class RedirectController {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly files: FilesService,
    private readonly config: ConfigService<EnvSchema, true>,
  ) {}

  private async resolveOr404(code: string, res: Response): Promise<CachedRedirectEntry | null> {
    const entry = await this.redirectService.resolve(code);
    if (!entry) {
      res.status(404).send(errorPage('Not found', 'This QR code does not exist or has been deleted.'));
      return null;
    }
    const availability = this.redirectService.checkAvailability(entry);
    if (!availability.ok) {
      const [title, message] = UNAVAILABLE_MESSAGES[availability.reason]!;
      res.status(410).send(errorPage(title, message));
      return null;
    }
    return entry;
  }

  private isUnlocked(req: Request, entry: CachedRedirectEntry): boolean {
    if (!entry.passwordHash) return true;
    return req.signedCookies?.[`qr_unlock_${entry.id}`] === '1';
  }

  @RateLimit({ limit: 120, ttlSeconds: 60 })
  @Get(':code')
  async handleRedirect(@Param('code') code: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const entry = await this.resolveOr404(code, res);
    if (!entry) return;

    this.redirectService.enqueueScan({
      qrCodeId: entry.id,
      scannedAt: new Date().toISOString(),
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      acceptLanguage: req.headers['accept-language'],
      utmSource: firstQueryValue(req.query.utm_source),
      utmMedium: firstQueryValue(req.query.utm_medium),
      utmCampaign: firstQueryValue(req.query.utm_campaign),
      utmTerm: firstQueryValue(req.query.utm_term),
      utmContent: firstQueryValue(req.query.utm_content),
    });

    if (!this.isUnlocked(req, entry)) {
      res.status(200).send(passwordPromptPage(`/r/${code}/unlock`));
      return;
    }

    await this.dispatchContent(entry, req, res);
  }

  @RateLimit({ limit: 10, ttlSeconds: 60 })
  @Post(':code/unlock')
  async unlock(
    @Param('code') code: string,
    @Body('password') password: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const entry = await this.resolveOr404(code, res);
    if (!entry) return;

    const valid = await this.redirectService.verifyPassword(entry, password ?? '');
    if (!valid) {
      res.status(401).send(passwordPromptPage(`/r/${code}/unlock`, 'Incorrect password, please try again.'));
      return;
    }

    res.cookie(`qr_unlock_${entry.id}`, '1', {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      maxAge: 60 * 60 * 1000,
      path: '/r',
    });
    res.redirect(302, `/r/${code}`);
  }

  @Get(':code/download/vcard')
  async downloadVCard(@Param('code') code: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const entry = await this.resolveOr404(code, res);
    if (!entry || !this.isUnlocked(req, entry) || entry.contentType !== ContentType.VCARD) {
      res.status(404).send(errorPage('Not found', 'Nothing to download here.'));
      return;
    }
    const payload = validateContentPayload(ContentType.VCARD, entry.content);
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contact.vcf"');
    res.send(encodeVCard(payload));
  }

  @Get(':code/download/ics')
  async downloadIcs(@Param('code') code: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const entry = await this.resolveOr404(code, res);
    if (!entry || !this.isUnlocked(req, entry) || entry.contentType !== ContentType.EVENT) {
      res.status(404).send(errorPage('Not found', 'Nothing to download here.'));
      return;
    }
    const payload = validateContentPayload(ContentType.EVENT, entry.content);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="event.ics"');
    res.send(encodeEvent(payload));
  }

  private async dispatchContent(entry: CachedRedirectEntry, req: Request, res: Response): Promise<void> {
    const ua = UAParser(req.headers['user-agent']);
    const platform = detectPlatform(ua.os.name, ua.device.type);
    const geo = getClientIp(req) ? geoip.lookup(getClientIp(req)!) : null;

    const ruleTarget = resolveSmartRedirect(entry.redirectRules, {
      platform,
      country: geo?.country,
      language: req.headers['accept-language'],
      now: new Date(),
    });
    if (ruleTarget) {
      res.redirect(entry.redirectStatusCode, ruleTarget);
      return;
    }

    const contentType = entry.contentType as ContentType;

    if (isInstantRedirect(contentType)) {
      res.redirect(entry.redirectStatusCode, this.resolveInstantTarget(contentType, entry.content, platform));
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(await this.renderLandingPage(entry, contentType));
  }

  private resolveInstantTarget(contentType: ContentType, content: unknown, platform: Platform): string {
    switch (contentType) {
      case ContentType.URL:
        return validateContentPayload(ContentType.URL, content).url;
      case ContentType.EMAIL:
        return encodeEmail(validateContentPayload(ContentType.EMAIL, content));
      case ContentType.PHONE:
        return encodePhone(validateContentPayload(ContentType.PHONE, content));
      case ContentType.SMS:
        return encodeSms(validateContentPayload(ContentType.SMS, content));
      case ContentType.WHATSAPP:
        return encodeWhatsapp(validateContentPayload(ContentType.WHATSAPP, content));
      case ContentType.APP_STORE:
        return resolveAppStoreUrlForPlatform(
          validateContentPayload(ContentType.APP_STORE, content),
          platform === 'desktop' ? 'other' : platform,
        );
      default:
        throw new Error(`${contentType} is not an instant-redirect content type`);
    }
  }

  private async renderLandingPage(entry: CachedRedirectEntry, contentType: ContentType): Promise<string> {
    const name = entry.name;
    switch (contentType) {
      case ContentType.TEXT:
        return textPage(name, validateContentPayload(ContentType.TEXT, entry.content));
      case ContentType.WIFI: {
        const data = validateContentPayload(ContentType.WIFI, entry.content);
        return wifiPage(name, data, this.buildWifiMiniQr(data));
      }
      case ContentType.VCARD:
        return vcardPage(
          name,
          validateContentPayload(ContentType.VCARD, entry.content),
          `/r/${entry.shortCode}/download/vcard`,
        );
      case ContentType.LOCATION:
        return locationPage(name, validateContentPayload(ContentType.LOCATION, entry.content));
      case ContentType.EVENT:
        return eventPage(
          name,
          validateContentPayload(ContentType.EVENT, entry.content),
          `/r/${entry.shortCode}/download/ics`,
        );
      case ContentType.CRYPTO:
        return cryptoPage(name, validateContentPayload(ContentType.CRYPTO, entry.content));
      case ContentType.SOCIAL:
        return socialPage(name, validateContentPayload(ContentType.SOCIAL, entry.content));
      case ContentType.CUSTOM:
        return customPage(name, validateContentPayload(ContentType.CUSTOM, entry.content));
      case ContentType.IMAGE: {
        const data = validateContentPayload(ContentType.IMAGE, entry.content);
        const url = await this.files.resolveUrl(data.fileId);
        return mediaPage(name, 'image', url);
      }
      case ContentType.PDF: {
        const data = validateContentPayload(ContentType.PDF, entry.content);
        const url = await this.files.resolveUrl(data.fileId);
        return mediaPage(name, 'pdf', url);
      }
      default:
        return errorPage('Unsupported', 'This content type is not supported yet.');
    }
  }

  private buildWifiMiniQr(data: ContentPayloadMap[ContentType.WIFI]): string {
    const scene = buildQrScene(encodeWifi(data), parseQrDesign({ size: 320, margin: 2 }));
    const svg = renderSceneToSvg(scene);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

function firstQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}
