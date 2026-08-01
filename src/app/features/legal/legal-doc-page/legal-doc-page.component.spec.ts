import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By, Title } from '@angular/platform-browser';
import { provideMarkdown } from 'ngx-markdown';

import { LegalDocPageComponent } from './legal-doc-page.component';

describe('LegalDocPageComponent', () => {
  let component: LegalDocPageComponent;
  let fixture: ComponentFixture<LegalDocPageComponent>;
  let httpMock: HttpTestingController;
  let titleService: jasmine.SpyObj<Title>;

  const mockMarkdownContent = `
# Terms of Service

This is a test markdown document.

## Section 1

Content for section 1.
  `.trim();

  beforeEach(async () => {
    const titleServiceSpy = jasmine.createSpyObj('Title', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [LegalDocPageComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [{ provide: Title, useValue: titleServiceSpy }, provideMarkdown()],
    }).compileComponents();

    titleService = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LegalDocPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.match('assets/legal/test.md').forEach((req) => req.flush(''));
    httpMock.verify();
  });

  it('should create', () => {
    // Arrange & Act
    fixture.componentRef.setInput('title', 'Test Document');
    fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
    fixture.componentRef.setInput('pageTitle', 'Test Document');
    fixture.detectChanges();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should set document title on init', () => {
      // Arrange
      fixture.componentRef.setInput('title', 'Test Document');
      fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
      fixture.componentRef.setInput('pageTitle', 'Test Document - Page Title');

      // Act
      fixture.detectChanges();

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('Test Document - Page Title');
    });

    it('should show loading state initially', () => {
      // Arrange
      fixture.componentRef.setInput('title', 'Test Document');
      fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
      fixture.componentRef.setInput('pageTitle', 'Test Document');

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.isLoading()).toBeTrue();
      const loadingElement = fixture.debugElement.query(By.css('[data-testid="loading-state"]'));
      expect(loadingElement).toBeTruthy();
    });

    it('should load markdown content from asset path', () => {
      // Arrange
      fixture.componentRef.setInput('title', 'Test Document');
      fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
      fixture.componentRef.setInput('pageTitle', 'Test Document');

      // Act
      fixture.detectChanges();

      // Assert HTTP request
      const req = httpMock.expectOne('assets/legal/test.md');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('text');

      // Respond with mock data
      req.flush(mockMarkdownContent);
      fixture.detectChanges();

      // Assert
      expect(component.content()).toBe(mockMarkdownContent);
      expect(component.isLoading()).toBeFalse();
      expect(component.hasError()).toBeFalse();
    });
  });

  describe('Content Rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('title', 'Test Document');
      fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
      fixture.componentRef.setInput('pageTitle', 'Test Document');
      fixture.componentRef.setInput('lastUpdated', '2026-02-15');
      fixture.detectChanges();
    });

    it('should render title and last updated date', () => {
      // Arrange & Act - load content
      const req = httpMock.expectOne('assets/legal/test.md');
      req.flush(mockMarkdownContent);
      fixture.detectChanges();

      // Assert
      const titleElement = fixture.debugElement.query(By.css('[data-testid="page-title"]'));
      const lastUpdatedElement = fixture.debugElement.query(By.css('[data-testid="last-updated"]'));

      expect(titleElement.nativeElement.textContent.trim()).toBe('Test Document');
      expect(lastUpdatedElement.nativeElement.textContent.trim()).toBe('Last updated: 2026-02-15');
    });

    it('should render markdown content when loaded successfully', () => {
      // Arrange & Act
      const req = httpMock.expectOne('assets/legal/test.md');
      req.flush(mockMarkdownContent);
      fixture.detectChanges();

      // Assert
      expect(component.isLoading()).toBeFalse();
      expect(component.hasError()).toBeFalse();

      const contentElement = fixture.debugElement.query(By.css('[data-testid="document-content"]'));
      expect(contentElement).toBeTruthy();
    });

    it('should not render last updated when not provided', () => {
      // Arrange - component without lastUpdated
      fixture.componentRef.setInput('lastUpdated', null);
      fixture.detectChanges();

      // Act
      const req = httpMock.expectOne('assets/legal/test.md');
      req.flush(mockMarkdownContent);
      fixture.detectChanges();

      // Assert
      const lastUpdatedElement = fixture.debugElement.query(By.css('[data-testid="last-updated"]'));
      expect(lastUpdatedElement).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('title', 'Test Document');
      fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
      fixture.componentRef.setInput('pageTitle', 'Test Document');
      fixture.detectChanges();
    });

    it('should show error state when markdown loading fails', () => {
      // Arrange & Act
      const req = httpMock.expectOne('assets/legal/test.md');
      req.error(new ErrorEvent('Network error'));
      fixture.detectChanges();

      // Assert
      expect(component.isLoading()).toBeFalse();
      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toBe('Document unavailable');

      const errorElement = fixture.debugElement.query(By.css('[data-testid="error-state"]'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Document unavailable');
    });

    it('should retry loading when reload button is clicked', () => {
      // Arrange - simulate initial error
      const req1 = httpMock.expectOne('assets/legal/test.md');
      req1.error(new ErrorEvent('Network error'));
      fixture.detectChanges();

      expect(component.hasError()).toBeTrue();

      // Act - click reload button
      const reloadButton = fixture.debugElement.query(By.css('[data-testid="reload-button"]'));
      expect(reloadButton).toBeTruthy();
      reloadButton.nativeElement.click();
      fixture.detectChanges();

      // Assert - verify reload clears error and starts loading
      expect(component.hasError()).toBeFalse();
      expect(component.isLoading()).toBeTrue();

      // Complete the retry request successfully
      const req2 = httpMock.expectOne('assets/legal/test.md');
      req2.flush(mockMarkdownContent);
      fixture.detectChanges();

      expect(component.hasError()).toBeFalse();
      expect(component.isLoading()).toBeFalse();
      expect(component.content()).toBe(mockMarkdownContent);
    });
  });

  describe('State Management', () => {
    it('should cancel the pending content request on component destruction', () => {
      // Arrange
      fixture.componentRef.setInput('title', 'Test Document');
      fixture.componentRef.setInput('assetPath', 'assets/legal/test.md');
      fixture.componentRef.setInput('pageTitle', 'Test Document');
      fixture.detectChanges();

      const req = httpMock.expectOne('assets/legal/test.md');

      // Act
      fixture.destroy();

      // Assert
      expect(req.cancelled).toBeTrue();
    });
  });
});
