import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideMarkdown } from 'ngx-markdown';
import { By } from '@angular/platform-browser';

import { TermsPageComponent } from './terms-page.component';
import { LEGAL_DOCS } from '../legal-docs.constants';
import { LegalDocPageComponent } from '../legal-doc-page/legal-doc-page.component';

describe('TermsPageComponent', () => {
  let component: TermsPageComponent;
  let fixture: ComponentFixture<TermsPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsPageComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [provideMarkdown()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TermsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // After
  afterEach(() => {
    httpMock.match('assets/legal/terms-of-service.md').forEach((req) => req.flush(''));
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use correct configuration from LEGAL_DOCS', () => {
    // Assert
    expect(component.config).toEqual(LEGAL_DOCS.terms);
    expect(component.config.title).toBe('Terms of Service');
    expect(component.config.pageTitle).toBe('Terms of Service');
    expect(component.config.assetPath).toBe('assets/legal/terms-of-service.md');
    expect(component.config.lastUpdated).toBe('2026-02-15');
  });

  it('should pass correct inputs to legal-doc-page component', () => {
    // Arrange & Act
    const legalDocPageElement = fixture.debugElement.query(By.css('wil-legal-doc-page'));

    // Assert
    expect(legalDocPageElement).toBeTruthy();

    const legalDocPageComponent = legalDocPageElement.componentInstance as LegalDocPageComponent;
    expect(legalDocPageComponent.title()).toBe('Terms of Service');
    expect(legalDocPageComponent.assetPath()).toBe('assets/legal/terms-of-service.md');
    expect(legalDocPageComponent.lastUpdated()).toBe('2026-02-15');
    expect(legalDocPageComponent.pageTitle()).toBe('Terms of Service');
  });

  it('should render terms page data-testid', () => {
    // Arrange & Act
    const termsPageElement = fixture.debugElement.query(By.css('[data-testid="terms-page"]'));

    // Assert
    expect(termsPageElement).toBeTruthy();
  });

  it('should load terms of service content', () => {
    // Arrange
    const mockContent = '# Terms of Service\n\nTest terms content';

    // Act - expect HTTP request for terms content
    const req = httpMock.expectOne('assets/legal/terms-of-service.md');
    expect(req.request.method).toBe('GET');
    req.flush(mockContent);

    fixture.detectChanges();

    // Assert - verify content is loaded (basic smoke test)
    // The actual content rendering is tested in LegalDocPageComponent
    expect(req.request.url).toBe('assets/legal/terms-of-service.md');
  });
});
