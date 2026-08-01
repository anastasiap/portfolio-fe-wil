import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { ActionButtonsComponent } from './action-buttons.component';
import {
  selectCategories,
  selectHasAllScores,
  selectHasUnsavedCategoriesChanges,
  selectHasUnsavedSessionChanges,
  selectLinkData,
  selectMode,
} from '../../../../state';
import { selectAccountId } from '../../../../state/auth/auth.selectors';
import type { WheelStateCategory, WheelStateMode } from '../../../../state/typings';
import { CookieService } from '../../../../services/cookie.service';
import { AnalyticsService } from '../../../../services/analytics/analytics.service';
import { DownloadImageModalComponent } from './ui/download-image-modal/download-image-modal.component';
import { APP_ICON_NAMES } from '../../../../core/services/app-icon-registry';

describe('ActionButtonsComponent', () => {
  let component: ActionButtonsComponent;
  let fixture: ComponentFixture<ActionButtonsComponent>;
  let store: MockStore;
  let dialog: jasmine.SpyObj<MatDialog>;

  const category = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'category-1',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 5,
    ...overrides,
  });

  async function setup(
    options: {
      type?: 'noAuth' | 'free' | 'personal' | 'professional';
      mode?: WheelStateMode;
      categories?: WheelStateCategory[];
      hasAllScores?: boolean;
      hasUnsavedWheelChanges?: boolean;
      hasUnsavedScoreChanges?: boolean;
      disableSaveWheelButton?: boolean;
    } = {}
  ): Promise<void> {
    const {
      type = 'personal',
      mode = 'view',
      categories = [category()],
      hasAllScores = true,
      hasUnsavedWheelChanges = false,
      hasUnsavedScoreChanges = false,
      disableSaveWheelButton = false,
    } = options;

    await TestBed.resetTestingModule();
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ActionButtonsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideMockStore(),
        { provide: MatDialog, useValue: dialog },
        {
          provide: CookieService,
          useValue: jasmine.createSpyObj<CookieService>('CookieService', ['hasCookie', 'setCookie']),
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']),
        },
      ],
    }).compileComponents();

    const iconRegistry = TestBed.inject(MatIconRegistry);
    const sanitizer = TestBed.inject(DomSanitizer);
    [
      APP_ICON_NAMES.add,
      APP_ICON_NAMES.check,
      APP_ICON_NAMES.close,
      APP_ICON_NAMES.delete,
      APP_ICON_NAMES.done,
      APP_ICON_NAMES.download,
      APP_ICON_NAMES.edit,
      APP_ICON_NAMES.resetMarks,
      APP_ICON_NAMES.resetWheel,
      APP_ICON_NAMES.saveCategories,
    ].forEach((iconName) => {
      iconRegistry.addSvgIconLiteral(iconName, sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
    });

    store = TestBed.inject(MockStore);
    store.overrideSelector(selectMode, mode);
    store.overrideSelector(selectCategories, categories);
    store.overrideSelector(selectHasAllScores, hasAllScores);
    store.overrideSelector(selectHasUnsavedCategoriesChanges, hasUnsavedWheelChanges);
    store.overrideSelector(selectHasUnsavedSessionChanges, hasUnsavedScoreChanges);
    store.overrideSelector(selectAccountId, 'account-1');
    store.overrideSelector(selectLinkData, null);
    store.refreshState();

    fixture = TestBed.createComponent(ActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('wheelId', 'wheel-1');
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('disableSaveWheelButton', disableSaveWheelButton);
    fixture.detectChanges();
  }

  function queryOptional(testId: string): DebugElement | null {
    return fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  }

  function query(testId: string): DebugElement {
    const element = queryOptional(testId);

    if (!element) {
      fail(`Expected ${testId} to render`);
    }

    return element as DebugElement;
  }

  function expectRendered(testIds: string[]): void {
    testIds.forEach((testId) => expect(queryOptional(testId)).withContext(`${testId} should render`).toBeTruthy());
  }

  function expectNotRendered(testIds: string[]): void {
    testIds.forEach((testId) => expect(queryOptional(testId)).withContext(`${testId} should not render`).toBeFalsy());
  }

  describe('render conditions', () => {
    it('should render no-auth view buttons only', async () => {
      // Arrange
      await setup({ type: 'noAuth', mode: 'view' });

      // Act
      fixture.detectChanges();

      // Assert
      expectRendered([
        'action-buttons-reset-marks-wrapper',
        'action-buttons-reset-wheel-wrapper',
        'action-buttons-download-wrapper',
        'action-buttons-save-result-wrapper',
        'action-buttons-add-wrapper',
        'action-buttons-save-categories-wrapper',
      ]);
      expectNotRendered([
        'action-buttons-focus-wrapper',
        'action-buttons-edit-wheel-wrapper',
        'action-buttons-add-wheel-wrapper',
        'use-default-wheel-wrapper',
        'action-buttons-delete-wheel-wrapper',
        'action-buttons-save-wheel-wrapper',
        'action-buttons-cancel-edits-wheel-wrapper',
      ]);
    });

    it('should render personal view buttons only', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'view' });

      // Act
      fixture.detectChanges();

      // Assert
      expectRendered([
        'action-buttons-focus-wrapper',
        'action-buttons-reset-marks-wrapper',
        'action-buttons-reset-wheel-wrapper',
        'action-buttons-download-wrapper',
        'action-buttons-save-result-wrapper',
        'action-buttons-edit-wheel-wrapper',
        'action-buttons-add-wheel-wrapper',
        'use-default-wheel-wrapper',
        'action-buttons-delete-wheel-wrapper',
      ]);
      expectNotRendered([
        'action-buttons-add-wrapper',
        'action-buttons-save-categories-wrapper',
        'action-buttons-save-wheel-wrapper',
        'action-buttons-cancel-edits-wheel-wrapper',
      ]);
    });

    it('should render personal edit buttons only', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'edit' });

      // Act
      fixture.detectChanges();

      // Assert
      expectRendered(['action-buttons-add-wrapper', 'action-buttons-save-wheel-wrapper', 'action-buttons-cancel-edits-wheel-wrapper']);
      expectNotRendered([
        'action-buttons-focus-wrapper',
        'action-buttons-reset-marks-wrapper',
        'action-buttons-reset-wheel-wrapper',
        'action-buttons-download-wrapper',
        'action-buttons-save-result-wrapper',
        'action-buttons-edit-wheel-wrapper',
        'action-buttons-add-wheel-wrapper',
        'use-default-wheel-wrapper',
        'action-buttons-delete-wheel-wrapper',
      ]);
    });

    it('should render no action buttons for professional view mode', async () => {
      // Arrange
      await setup({ type: 'professional', mode: 'view' });

      // Act
      fixture.detectChanges();

      // Assert
      expectRendered(['action-buttons-container']);
      expectNotRendered([
        'action-buttons-focus-wrapper',
        'action-buttons-reset-marks-wrapper',
        'action-buttons-reset-wheel-wrapper',
        'action-buttons-download-wrapper',
        'action-buttons-save-result-wrapper',
        'action-buttons-add-wrapper',
        'action-buttons-save-wheel-wrapper',
        'action-buttons-cancel-edits-wheel-wrapper',
      ]);
    });

    it('should render no action buttons for professional edit mode', async () => {
      // Arrange
      await setup({ type: 'professional', mode: 'edit' });

      // Act
      fixture.detectChanges();

      // Assert
      expectRendered(['action-buttons-container']);
      expectNotRendered([
        'action-buttons-focus-wrapper',
        'action-buttons-reset-marks-wrapper',
        'action-buttons-reset-wheel-wrapper',
        'action-buttons-download-wrapper',
        'action-buttons-save-result-wrapper',
        'action-buttons-add-wrapper',
        'action-buttons-save-wheel-wrapper',
        'action-buttons-cancel-edits-wheel-wrapper',
      ]);
    });
  });

  describe('labels', () => {
    it('should render no-auth download and save result labels', async () => {
      // Arrange
      await setup({ type: 'noAuth', mode: 'view' });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-download-label').nativeElement.textContent.trim()).toBe('download');
      expect(query('action-buttons-save-result-label').nativeElement.textContent.trim()).toBe('saveResult');
    });

    it('should render authenticated download and save session labels', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'view' });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-download-label').nativeElement.textContent.trim()).toBe('downloadSession');
      expect(query('action-buttons-save-result-label').nativeElement.textContent.trim()).toBe('saveSession');
    });
  });

  describe('disabled states', () => {
    it('should disable category-dependent view buttons when there are no categories', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'view', categories: [] });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-focus-button').nativeElement.disabled).toBeTrue();
      expect(query('action-buttons-reset-marks-button').nativeElement.disabled).toBeTrue();
      expect(query('action-buttons-download-button').nativeElement.disabled).toBeTrue();
    });

    it('should disable save result for authenticated users when not all scores are present', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'view', hasAllScores: false });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-result-button').nativeElement.disabled).toBeTrue();
    });

    it('should keep save result enabled for no-auth users without all scores', async () => {
      // Arrange
      await setup({ type: 'noAuth', mode: 'view', hasAllScores: false });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-result-button').nativeElement.disabled).toBeFalse();
    });

    it('should disable save wheel when disableSaveWheelButton is true', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'edit', disableSaveWheelButton: true });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-wheel-button').nativeElement.disabled).toBeTrue();
    });
  });

  describe('download modal', () => {
    it('should open the download image modal with categories', async () => {
      // Arrange
      const categories = [category({ id: 'health' })];
      await setup({ categories });
      spyOn(component, 'executeImageDownload').and.resolveTo();

      // Act
      component.onDownloadClick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(
        DownloadImageModalComponent,
        jasmine.objectContaining({
          data: { categories },
          width: '520px',
          maxWidth: 'calc(100vw - 2rem)',
          autoFocus: false,
          role: 'dialog',
        })
      );
      expect(component.executeImageDownload).toHaveBeenCalled();
    });
  });

  describe('dynamic classes', () => {
    it('should mark no-auth save result as locked', async () => {
      // Arrange
      await setup({ type: 'noAuth', mode: 'view' });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-result-button').nativeElement.classList.contains('locked')).toBeTrue();
    });

    it('should mark authenticated save result active when all scores are present', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'view', hasAllScores: true });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-result-button').nativeElement.classList.contains('btn--active')).toBeTrue();
    });

    it('should not mark authenticated save result active when save wheel button is disabled', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'view', hasAllScores: true, disableSaveWheelButton: true });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-result-button').nativeElement.classList.contains('btn--active')).toBeFalse();
    });

    it('should mark save wheel active when there are unsaved wheel changes', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'edit', hasUnsavedWheelChanges: true });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-wheel-button').nativeElement.classList.contains('btn--active')).toBeTrue();
    });

    it('should not mark save wheel active when save wheel button is disabled', async () => {
      // Arrange
      await setup({ type: 'personal', mode: 'edit', hasUnsavedWheelChanges: true, disableSaveWheelButton: true });

      // Act
      fixture.detectChanges();

      // Assert
      expect(query('action-buttons-save-wheel-button').nativeElement.classList.contains('btn--active')).toBeFalse();
    });
  });
});
