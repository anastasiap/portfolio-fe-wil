import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { AnalyticsService } from '../../../../../../services/analytics/analytics.service';
import { WheelStateCategory } from '../../../../../../state/typings';
import { DownloadModalState } from '../../typings';
import { DownloadImageModalComponent } from './download-image-modal.component';

describe('DownloadImageModalComponent', () => {
  let component: DownloadImageModalComponent;
  let fixture: ComponentFixture<DownloadImageModalComponent>;
  let router: jasmine.SpyObj<Router>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  const categories: WheelStateCategory[] = [
    {
      id: 'health',
      name: 'Health',
      description: 'Physical wellbeing',
      color: '#ff0000',
      order: 0,
      score: 7,
    },
    {
      id: 'career',
      name: 'Career',
      description: 'Professional growth',
      color: '#00ff00',
      order: 1,
      score: 5,
    },
  ];

  const setup = (downloadModalState: DownloadModalState | null, categoryValues: WheelStateCategory[] | null = categories): void => {
    fixture = TestBed.createComponent(DownloadImageModalComponent);
    fixture.componentRef.setInput('downloadModalState', downloadModalState);
    fixture.componentRef.setInput('categories', categoryValues);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [DownloadImageModalComponent],
      providers: [
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: AnalyticsService,
          useValue: analytics,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    setup(null, null);

    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should show loading content and hide preview content when the modal is loading', () => {
      // Arrange & Act
      setup('loading');

      // Assert
      expect(queryByTestId('download-modal')).not.toBeNull();
      expect(queryByTestId('download-modal-title').nativeElement.textContent).toContain('Downloading your image');
      expect(queryByTestId('download-modal-loading')).not.toBeNull();
      expect(queryByTestId('download-modal-spinner')).not.toBeNull();
      expect(queryByTestId('download-modal-loading-title').nativeElement.textContent).toContain('Generating your image');
      expect(queryByTestId('download-modal-preview')).toBeNull();
      expect(queryByTestId('download-modal-cta')).toBeNull();
    });

    it('should show preview summary and conversion content when the modal is in preview state', () => {
      // Arrange & Act
      setup('preview');

      // Assert
      expect(queryByTestId('download-modal-preview')).not.toBeNull();
      expect(queryByTestId('download-modal-loading')).toBeNull();
      expect(queryByTestId('download-modal-preview-label').nativeElement.textContent).toContain(
        'This is what your next check-in could look like:',
      );
      expect(queryByTestId('download-modal-change-label').nativeElement.textContent).toContain('Biggest change:');
      expect(queryByTestId('download-modal-change-finances-value').nativeElement.textContent).toContain('Finances');
      expect(queryByTestId('download-modal-change-health-value').nativeElement.textContent).toContain('Health');
      expect(queryByTestId('download-modal-conversion-text').nativeElement.textContent).toContain(
        "Without this, you're just guessing if anything changed.",
      );
      expect(queryByTestId('download-modal-cta').nativeElement.textContent).toContain('Save your session with Free account');
    });

    it('should render category comparison rows from the provided categories in preview state', () => {
      // Arrange & Act
      setup('preview');

      // Assert
      expect(queryByTestId('download-modal-table-header-category').nativeElement.textContent).toContain('Category');
      expect(queryByTestId('download-modal-table-header-current').nativeElement.textContent).toContain('Current session');
      expect(queryByTestId('download-modal-table-header-future').nativeElement.textContent).toContain('Next session');
      expect(queryByTestId('download-modal-table-header-delta').nativeElement.textContent).toContain('Delta');

      expect(queryByTestId('download-modal-table-row-health')).not.toBeNull();
      expect(queryByTestId('download-modal-table-category-health').nativeElement.textContent).toContain('Health');
      expect(queryByTestId('download-modal-table-current-health').nativeElement.textContent).toContain('7');
      expect(queryByTestId('download-modal-table-future-health').nativeElement.textContent).toContain('?');
      expect(queryByTestId('download-modal-table-delta-health').nativeElement.textContent).toContain('0');

      expect(queryByTestId('download-modal-table-row-career')).not.toBeNull();
      expect(queryByTestId('download-modal-table-category-career').nativeElement.textContent).toContain('Career');
      expect(queryByTestId('download-modal-table-current-career').nativeElement.textContent).toContain('5');
      expect(queryByTestId('download-modal-table-future-career').nativeElement.textContent).toContain('?');
      expect(queryByTestId('download-modal-table-delta-career').nativeElement.textContent).toContain('0');
    });
  });
});
