const isRestrictedUrl = require('./backend.js').isRestrictedUrl;

describe('isRestrictedUrl', () => {
  test('should return true for chrome:// URLs', () => {
    expect(isRestrictedUrl('chrome://extensions')).toBe(true);
  });

  test('should return true for chrome-extension:// URLs', () => {
    expect(isRestrictedUrl('chrome-extension://some-id')).toBe(true);
  });

  test('should return true for devtools:// URLs', () => {
    expect(isRestrictedUrl('devtools://devtools/bundled/inspector.html')).toBe(true);
  });

  test('should return true for edge:// URLs', () => {
    expect(isRestrictedUrl('edge://settings')).toBe(true);
  });

  test('should return true for about: URLs', () => {
    expect(isRestrictedUrl('about:blank')).toBe(true);
  });

  test('should return true for chrome-search:// URLs', () => {
    expect(isRestrictedUrl('chrome-search://local-ntp/local-ntp.html')).toBe(true);
  });

  test('should return true for file:// URLs', () => {
    expect(isRestrictedUrl('file:///C:/Users/test.txt')).toBe(true);
  });

  test('should return false for http:// URLs', () => {
    expect(isRestrictedUrl('http://example.com')).toBe(false);
  });

  test('should return false for https:// URLs', () => {
    expect(isRestrictedUrl('https://example.com')).toBe(false);
  });

  test('should return true for a null URL', () => {
    expect(isRestrictedUrl(null)).toBe(true);
  });

  test('should return true for an undefined URL', () => {
    expect(isRestrictedUrl(undefined)).toBe(true);
  });
});