import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CookieService } from './cookie.service';

describe('CookieService', () => {
  let service: CookieService;
  const createdCookieNames: string[] = [];

  const uniqueCookieName = (suffix: string): string => {
    const name = `wil_cookie_service_spec_${suffix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    createdCookieNames.push(name);
    return name;
  };

  const configureService = (platformId: 'browser' | 'server' = 'browser'): void => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    service = TestBed.inject(CookieService);
  };

  const expireCookie = (name: string): void => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  };

  beforeEach(() => {
    configureService();
  });

  afterEach(() => {
    createdCookieNames.forEach((name) => expireCookie(name));
    createdCookieNames.length = 0;
    TestBed.resetTestingModule();
  });

  describe('setCookie', () => {
    it('should store a root SameSite cookie that can be read back in the browser', () => {
      // Arrange
      const name = uniqueCookieName('set_read');

      // Act
      service.setCookie(name, 'accepted');

      // Assert
      expect(document.cookie).toContain(`${name}=accepted`);
      expect(service.getCookie(name)).toBe('accepted');
    });

    it('should store a future-expiring cookie when a positive day count is provided', () => {
      // Arrange
      const name = uniqueCookieName('future_expiry');

      // Act
      service.setCookie(name, 'persistent', 1);

      // Assert
      expect(service.getCookie(name)).toBe('persistent');
      expect(service.hasCookie(name)).toBeTrue();
    });

    it('should treat zero days as a session cookie instead of expiring it immediately', () => {
      // Arrange
      const name = uniqueCookieName('zero_days');

      // Act
      service.setCookie(name, 'session', 0);

      // Assert
      expect(service.getCookie(name)).toBe('session');
    });

    it('should expire the cookie immediately when a negative day count is provided', () => {
      // Arrange
      const name = uniqueCookieName('negative_days');

      // Act
      service.setCookie(name, 'expired', -1);

      // Assert
      expect(service.hasCookie(name)).toBeFalse();
    });

    it('should store empty string for empty or malformed falsy values', () => {
      // Arrange
      const emptyName = uniqueCookieName('empty_value');
      const nullName = uniqueCookieName('null_value');

      // Act
      service.setCookie(emptyName, '');
      service.setCookie(nullName, null as unknown as string);

      // Assert
      expect(service.getCookie(emptyName)).toBe('');
      expect(service.getCookie(nullName)).toBe('');
    });

    it('should not write cookies outside the browser platform', () => {
      // Arrange
      const name = uniqueCookieName('server_set');
      configureService('server');

      // Act
      service.setCookie(name, 'ignored');

      // Assert
      expect(document.cookie).not.toContain(`${name}=ignored`);
    });
  });

  describe('getCookie', () => {
    it('should return null when the cookie does not exist', () => {
      // Arrange
      const name = uniqueCookieName('missing');

      // Act
      const result = service.getCookie(name);

      // Assert
      expect(result).toBeNull();
    });

    it('should read the requested cookie from a multi-cookie document string', () => {
      // Arrange
      const firstName = uniqueCookieName('first');
      const secondName = uniqueCookieName('second');
      service.setCookie(firstName, 'one');
      service.setCookie(secondName, 'two');

      // Act
      const result = service.getCookie(secondName);

      // Assert
      expect(result).toBe('two');
    });

    it('should match cookie names exactly instead of matching a longer prefixed name', () => {
      // Arrange
      const name = uniqueCookieName('exact');
      service.setCookie(`${name}_id`, 'wrong');
      service.setCookie(name, 'right');
      createdCookieNames.push(`${name}_id`);

      // Act
      const result = service.getCookie(name);

      // Assert
      expect(result).toBe('right');
    });

    it('should return an empty string when the cookie exists with an empty value', () => {
      // Arrange
      const name = uniqueCookieName('empty_get');
      service.setCookie(name, '');

      // Act
      const result = service.getCookie(name);

      // Assert
      expect(result).toBe('');
    });

    it('should return null for an empty cookie name in normal cookie state', () => {
      // Act
      const result = service.getCookie('');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null outside the browser platform', () => {
      // Arrange
      const name = uniqueCookieName('server_get');
      document.cookie = `${name}=browser-value; path=/; SameSite=Lax`;
      configureService('server');

      // Act
      const result = service.getCookie(name);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteCookie', () => {
    it('should delete an existing cookie in the browser', () => {
      // Arrange
      const name = uniqueCookieName('delete_existing');
      service.setCookie(name, 'delete-me');
      expect(service.hasCookie(name)).toBeTrue();

      // Act
      service.deleteCookie(name);

      // Assert
      expect(service.getCookie(name)).toBeNull();
      expect(service.hasCookie(name)).toBeFalse();
    });

    it('should not throw when deleting a missing cookie', () => {
      // Arrange
      const name = uniqueCookieName('delete_missing');

      // Act & Assert
      expect(() => service.deleteCookie(name)).not.toThrow();
      expect(service.hasCookie(name)).toBeFalse();
    });

    it('should not delete cookies outside the browser platform', () => {
      // Arrange
      const name = uniqueCookieName('server_delete');
      document.cookie = `${name}=still-present; path=/; SameSite=Lax`;
      configureService('server');

      // Act
      service.deleteCookie(name);

      // Assert
      expect(document.cookie).toContain(`${name}=still-present`);
    });
  });

  describe('hasCookie', () => {
    it('should return true when a cookie exists with a non-empty value', () => {
      // Arrange
      const name = uniqueCookieName('has_value');
      service.setCookie(name, 'yes');

      // Act
      const result = service.hasCookie(name);

      // Assert
      expect(result).toBeTrue();
    });

    it('should return true when a cookie exists with an empty value', () => {
      // Arrange
      const name = uniqueCookieName('has_empty');
      service.setCookie(name, '');

      // Act
      const result = service.hasCookie(name);

      // Assert
      expect(result).toBeTrue();
    });

    it('should return false when a cookie is missing', () => {
      // Arrange
      const name = uniqueCookieName('has_missing');

      // Act
      const result = service.hasCookie(name);

      // Assert
      expect(result).toBeFalse();
    });

    it('should return false outside the browser platform', () => {
      // Arrange
      const name = uniqueCookieName('server_has');
      document.cookie = `${name}=browser-value; path=/; SameSite=Lax`;
      configureService('server');

      // Act
      const result = service.hasCookie(name);

      // Assert
      expect(result).toBeFalse();
    });
  });

  describe('state order dependency', () => {
    it('should allow get, has, and delete before any set without corrupting later writes', () => {
      // Arrange
      const name = uniqueCookieName('order');

      // Act
      const missingValue = service.getCookie(name);
      const missingPresence = service.hasCookie(name);
      service.deleteCookie(name);
      service.setCookie(name, 'created-later');

      // Assert
      expect(missingValue).toBeNull();
      expect(missingPresence).toBeFalse();
      expect(service.getCookie(name)).toBe('created-later');
    });

    it('should allow a cookie to be set again after deletion', () => {
      // Arrange
      const name = uniqueCookieName('reset');
      service.setCookie(name, 'first');
      service.deleteCookie(name);

      // Act
      service.setCookie(name, 'second');

      // Assert
      expect(service.getCookie(name)).toBe('second');
    });
  });
});
