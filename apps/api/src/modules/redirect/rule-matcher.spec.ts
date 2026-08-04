import { RedirectRuleType } from '@qrgen/shared';
import { resolveSmartRedirect, ruleMatches, type RuleContext } from './rule-matcher';

function ctx(overrides: Partial<RuleContext> = {}): RuleContext {
  return { platform: 'desktop', now: new Date('2026-06-15T12:00:00.000Z'), ...overrides };
}

describe('ruleMatches / DEVICE', () => {
  const rule = { type: RedirectRuleType.DEVICE, condition: { devices: ['ios', 'android'] } };

  it('matches when the platform is in the configured device list', () => {
    expect(ruleMatches(rule, ctx({ platform: 'ios' }))).toBe(true);
    expect(ruleMatches(rule, ctx({ platform: 'android' }))).toBe(true);
  });

  it('does not match a platform outside the list', () => {
    expect(ruleMatches(rule, ctx({ platform: 'desktop' }))).toBe(false);
  });

  it('does not match when no devices are configured', () => {
    expect(ruleMatches({ type: RedirectRuleType.DEVICE, condition: {} }, ctx({ platform: 'ios' }))).toBe(
      false,
    );
  });
});

describe('ruleMatches / COUNTRY', () => {
  const rule = { type: RedirectRuleType.COUNTRY, condition: { countries: ['US', 'CA'] } };

  it('matches a configured country', () => {
    expect(ruleMatches(rule, ctx({ country: 'US' }))).toBe(true);
  });

  it('is case-insensitive on the scanned country code', () => {
    expect(ruleMatches(rule, ctx({ country: 'us' }))).toBe(true);
  });

  it('does not match an unconfigured country', () => {
    expect(ruleMatches(rule, ctx({ country: 'FR' }))).toBe(false);
  });

  it('does not match when country is unknown (geo lookup failed)', () => {
    expect(ruleMatches(rule, ctx({ country: undefined }))).toBe(false);
  });
});

describe('ruleMatches / LANGUAGE', () => {
  const rule = { type: RedirectRuleType.LANGUAGE, condition: { languages: ['en', 'fr'] } };

  it('matches on the primary subtag of a full locale (en-US -> en)', () => {
    expect(ruleMatches(rule, ctx({ language: 'en-US' }))).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(ruleMatches(rule, ctx({ language: 'EN-us' }))).toBe(true);
  });

  it('does not match an unconfigured language', () => {
    expect(ruleMatches(rule, ctx({ language: 'de-DE' }))).toBe(false);
  });

  it('does not match when language is missing', () => {
    expect(ruleMatches(rule, ctx({ language: undefined }))).toBe(false);
  });
});

describe('ruleMatches / TIME', () => {
  const rule = {
    type: RedirectRuleType.TIME,
    condition: { timezone: 'UTC', days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00' },
  };

  it('matches a weekday within the configured time window', () => {
    // 2026-06-15 is a Monday.
    expect(ruleMatches(rule, ctx({ now: new Date('2026-06-15T12:00:00.000Z') }))).toBe(true);
  });

  it('does not match outside the time window', () => {
    expect(ruleMatches(rule, ctx({ now: new Date('2026-06-15T20:00:00.000Z') }))).toBe(false);
  });

  it('does not match on a day not in the configured list', () => {
    // 2026-06-14 is a Sunday.
    expect(ruleMatches(rule, ctx({ now: new Date('2026-06-14T12:00:00.000Z') }))).toBe(false);
  });

  it('matches exactly at the window boundaries (inclusive)', () => {
    expect(ruleMatches(rule, ctx({ now: new Date('2026-06-15T09:00:00.000Z') }))).toBe(true);
    expect(ruleMatches(rule, ctx({ now: new Date('2026-06-15T17:00:00.000Z') }))).toBe(true);
  });

  it('respects a non-UTC timezone', () => {
    const nyRule = { ...rule, condition: { ...rule.condition, timezone: 'America/New_York' } };
    // 12:00 UTC is 08:00 in New York (EDT, UTC-4) in June - before the 09:00 window opens.
    expect(ruleMatches(nyRule, ctx({ now: new Date('2026-06-15T12:00:00.000Z') }))).toBe(false);
    // 14:00 UTC is 10:00 in New York - inside the window.
    expect(ruleMatches(nyRule, ctx({ now: new Date('2026-06-15T14:00:00.000Z') }))).toBe(true);
  });

  it('does not match with an invalid IANA timezone', () => {
    const badRule = { ...rule, condition: { ...rule.condition, timezone: 'Not/AZone' } };
    expect(ruleMatches(badRule, ctx())).toBe(false);
  });
});

describe('ruleMatches / unknown rule type', () => {
  it('returns false rather than throwing', () => {
    // @ts-expect-error deliberately invalid type to assert the default branch
    expect(ruleMatches({ type: 'BOGUS', condition: {} }, ctx())).toBe(false);
  });
});

describe('resolveSmartRedirect', () => {
  const deviceRule = {
    type: RedirectRuleType.DEVICE,
    condition: { devices: ['ios'] },
    destinationUrl: 'https://example.com/ios',
    isActive: true,
    priority: 2,
  };
  const countryRule = {
    type: RedirectRuleType.COUNTRY,
    condition: { countries: ['US'] },
    destinationUrl: 'https://example.com/us',
    isActive: true,
    priority: 1,
  };

  it('returns the destination of the first matching rule in priority order', () => {
    const result = resolveSmartRedirect(
      [deviceRule, countryRule],
      ctx({ platform: 'ios', country: 'US' }),
    );
    // priority 1 (countryRule) beats priority 2 (deviceRule) even though both match.
    expect(result).toBe('https://example.com/us');
  });

  it('falls through to a lower-priority rule if a higher-priority one does not match', () => {
    const result = resolveSmartRedirect(
      [deviceRule, countryRule],
      ctx({ platform: 'ios', country: 'FR' }),
    );
    expect(result).toBe('https://example.com/ios');
  });

  it('ignores inactive rules even if they would otherwise match', () => {
    const result = resolveSmartRedirect(
      [{ ...countryRule, isActive: false }],
      ctx({ country: 'US' }),
    );
    expect(result).toBeNull();
  });

  it('returns null when no rule matches', () => {
    const result = resolveSmartRedirect([deviceRule, countryRule], ctx({ platform: 'desktop' }));
    expect(result).toBeNull();
  });

  it('returns null for an empty rule set', () => {
    expect(resolveSmartRedirect([], ctx())).toBeNull();
  });
});
