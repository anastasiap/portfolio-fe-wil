import { Injectable, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export const APP_ICON_NAMES = {
  add: 'wil-add',
  check: 'wil-check',
  close: 'wil-close',
  color: 'wil-color',
  delete: 'wil-delete',
  done: 'wil-done',
  download: 'wil-download',
  edit: 'wil-edit',
  resetMarks: 'wil-reset-marks',
  resetWheel: 'wil-reset-wheel',
  saveCategories: 'wil-save-categories',
} as const;

export type AppIconName = (typeof APP_ICON_NAMES)[keyof typeof APP_ICON_NAMES];

const APP_ICON_FILE_NAMES: Readonly<Record<AppIconName, string>> = {
  [APP_ICON_NAMES.add]: 'add',
  [APP_ICON_NAMES.check]: 'check',
  [APP_ICON_NAMES.close]: 'close',
  [APP_ICON_NAMES.color]: 'color',
  [APP_ICON_NAMES.delete]: 'delete',
  [APP_ICON_NAMES.done]: 'done',
  [APP_ICON_NAMES.download]: 'download',
  [APP_ICON_NAMES.edit]: 'edit',
  [APP_ICON_NAMES.resetMarks]: 'reset-marks',
  [APP_ICON_NAMES.resetWheel]: 'reset-wheel',
  [APP_ICON_NAMES.saveCategories]: 'save-categories',
};

@Injectable({ providedIn: 'root' })
export class AppIconRegistry {
  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);

  public register(): void {
    Object.entries(APP_ICON_FILE_NAMES).forEach(([iconName, fileName]) => {
      this.iconRegistry.addSvgIcon(iconName, this.sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${fileName}.svg`));
    });
  }
}
