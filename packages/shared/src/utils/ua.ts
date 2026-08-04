import { DeviceCategory } from '../enums';

export type AppStorePlatform = 'ios' | 'android' | 'other';

export function deviceCategoryFromUaResult(deviceType: string | undefined): DeviceCategory {
  switch (deviceType) {
    case 'mobile':
      return DeviceCategory.MOBILE;
    case 'tablet':
      return DeviceCategory.TABLET;
    case 'bot':
      return DeviceCategory.BOT;
    case undefined:
      return DeviceCategory.DESKTOP;
    default:
      return DeviceCategory.OTHER;
  }
}

export function appStorePlatformFromOsName(osName: string | undefined): AppStorePlatform {
  const name = (osName ?? '').toLowerCase();
  if (name.includes('ios') || name.includes('mac')) return 'ios';
  if (name.includes('android')) return 'android';
  return 'other';
}
