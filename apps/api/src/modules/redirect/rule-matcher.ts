import { RedirectRuleType } from '@qrgen/shared';
import type { RedirectRule } from '@prisma/client';

export interface RuleContext {
  platform: 'ios' | 'android' | 'desktop' | 'other';
  country?: string;
  language?: string;
  now: Date;
}

function getTimeInZone(date: Date, timeZone: string): { day: number; hhmm: string } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const weekday = parts.find((p) => p.type === 'weekday')?.value;
    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    if (!weekday || hour === undefined || minute === undefined) return null;
    return { day: dayMap[weekday]!, hhmm: `${hour}:${minute}` };
  } catch {
    return null;
  }
}

/** Matches a single redirect rule's condition against the resolved scan context. */
export function ruleMatches(rule: Pick<RedirectRule, 'type' | 'condition'>, context: RuleContext): boolean {
  const condition = rule.condition as Record<string, unknown>;

  switch (rule.type) {
    case RedirectRuleType.DEVICE: {
      const devices = (condition.devices as string[] | undefined) ?? [];
      return devices.includes(context.platform);
    }
    case RedirectRuleType.COUNTRY: {
      const countries = (condition.countries as string[] | undefined) ?? [];
      return Boolean(context.country) && countries.includes(context.country!.toUpperCase());
    }
    case RedirectRuleType.LANGUAGE: {
      const languages = (condition.languages as string[] | undefined) ?? [];
      const primary = context.language?.split('-')[0]?.toLowerCase();
      return Boolean(primary) && languages.some((l) => l.toLowerCase().startsWith(primary!));
    }
    case RedirectRuleType.TIME: {
      const timezone = (condition.timezone as string | undefined) ?? 'UTC';
      const days = (condition.days as number[] | undefined) ?? [];
      const startTime = condition.startTime as string | undefined;
      const endTime = condition.endTime as string | undefined;
      const local = getTimeInZone(context.now, timezone);
      if (!local || !startTime || !endTime) return false;
      return days.includes(local.day) && local.hhmm >= startTime && local.hhmm <= endTime;
    }
    default:
      return false;
  }
}

/** Returns the destination URL of the first active rule (in priority order) that matches, if any. */
export function resolveSmartRedirect(
  rules: Pick<RedirectRule, 'type' | 'condition' | 'destinationUrl' | 'isActive' | 'priority'>[],
  context: RuleContext,
): string | null {
  const active = rules.filter((r) => r.isActive).sort((a, b) => a.priority - b.priority);
  for (const rule of active) {
    if (ruleMatches(rule, context)) return rule.destinationUrl;
  }
  return null;
}
