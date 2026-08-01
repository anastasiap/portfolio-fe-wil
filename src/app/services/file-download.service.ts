import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  public downloadUrl(url: string, filename: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.document.body) {
      return;
    }

    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);
  }
}
