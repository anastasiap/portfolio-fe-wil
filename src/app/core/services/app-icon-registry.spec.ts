import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { APP_ICON_NAMES, AppIconRegistry } from './app-icon-registry';

describe('AppIconRegistry', () => {
  let iconRegistry: jasmine.SpyObj<MatIconRegistry>;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(() => {
    iconRegistry = jasmine.createSpyObj<MatIconRegistry>('MatIconRegistry', ['addSvgIcon']);
    sanitizer = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
    sanitizer.bypassSecurityTrustResourceUrl.and.callFake((url: string) => url as unknown as SafeResourceUrl);

    TestBed.configureTestingModule({
      providers: [AppIconRegistry, { provide: MatIconRegistry, useValue: iconRegistry }, { provide: DomSanitizer, useValue: sanitizer }],
    });
  });

  it('should register every custom icon with its wil-prefixed name and asset URL', () => {
    // Arrange
    const registry = TestBed.inject(AppIconRegistry);
    const expectedIcons = [
      [APP_ICON_NAMES.add, 'assets/icons/add.svg'],
      [APP_ICON_NAMES.check, 'assets/icons/check.svg'],
      [APP_ICON_NAMES.close, 'assets/icons/close.svg'],
      [APP_ICON_NAMES.color, 'assets/icons/color.svg'],
      [APP_ICON_NAMES.delete, 'assets/icons/delete.svg'],
      [APP_ICON_NAMES.done, 'assets/icons/done.svg'],
      [APP_ICON_NAMES.download, 'assets/icons/download.svg'],
      [APP_ICON_NAMES.edit, 'assets/icons/edit.svg'],
      [APP_ICON_NAMES.resetMarks, 'assets/icons/reset-marks.svg'],
      [APP_ICON_NAMES.resetWheel, 'assets/icons/reset-wheel.svg'],
      [APP_ICON_NAMES.saveCategories, 'assets/icons/save-categories.svg'],
    ];

    // Act
    registry.register();

    // Assert
    expect(iconRegistry.addSvgIcon).toHaveBeenCalledTimes(expectedIcons.length);
    expectedIcons.forEach(([name, url]) => {
      expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(url);
      expect(iconRegistry.addSvgIcon).toHaveBeenCalledWith(name, url as unknown as SafeResourceUrl);
    });
  });
});
