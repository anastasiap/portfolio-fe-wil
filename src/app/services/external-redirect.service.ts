import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExternalRedirectService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  public redirect(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.defaultView?.location.assign(url);
  }
}
