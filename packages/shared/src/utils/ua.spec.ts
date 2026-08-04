import { DeviceCategory } from '../enums';
import { appStorePlatformFromOsName, deviceCategoryFromUaResult } from './ua';

describe('deviceCategoryFromUaResult', () => {
  it.each([
    ['mobile', DeviceCategory.MOBILE],
    ['tablet', DeviceCategory.TABLET],
    ['bot', DeviceCategory.BOT],
    [undefined, DeviceCategory.DESKTOP],
    ['smarttv', DeviceCategory.OTHER],
    ['wearable', DeviceCategory.OTHER],
  ])('maps ua-parser-js deviceType %p to %p', (input, expected) => {
    expect(deviceCategoryFromUaResult(input)).toBe(expected);
  });
});

describe('appStorePlatformFromOsName', () => {
  it.each([
    ['iOS', 'ios'],
    ['Mac OS', 'ios'],
    ['Android', 'android'],
    ['Windows', 'other'],
    [undefined, 'other'],
  ])('maps ua-parser-js os name %p to %p', (input, expected) => {
    expect(appStorePlatformFromOsName(input)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(appStorePlatformFromOsName('IOS')).toBe('ios');
    expect(appStorePlatformFromOsName('ANDROID')).toBe('android');
  });
});
