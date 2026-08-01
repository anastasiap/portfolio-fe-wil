import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  private readonly platformId = inject(PLATFORM_ID);

  public setCookie(name: string, value: string, days?: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }

    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax`;
  }

  public getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');

    for (let c of ca) {
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  public deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  public hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }
}
