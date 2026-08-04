import { ContentType } from '@qrgen/shared';
import { CONTENT_TYPE_LABELS } from './content-type-labels';

describe('CONTENT_TYPE_LABELS', () => {
  it('has a non-empty label for every ContentType member', () => {
    for (const type of Object.values(ContentType)) {
      expect(CONTENT_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('has no stray keys beyond the ContentType enum', () => {
    const validKeys = new Set(Object.values(ContentType));
    for (const key of Object.keys(CONTENT_TYPE_LABELS)) {
      expect(validKeys.has(key as ContentType)).toBe(true);
    }
  });
});
