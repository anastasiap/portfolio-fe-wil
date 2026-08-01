import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideMarkdown } from 'ngx-markdown';
import { By } from '@angular/platform-browser';

import { PrivacyPageComponent } from './privacy-page.component';
import { LEGAL_DOCS } from '../legal-docs.constants';

describe('PrivacyPageComponent', () => {
  let component: PrivacyPageComponent;
  let fixture: ComponentFixture<PrivacyPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPageComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [provideMarkdown()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PrivacyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // After
  afterEach(() => {
    httpMock.match('assets/legal/privacy-policy.md').forEach((req) => req.flush(''));
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use correct configuration from LEGAL_DOCS', () => {
    // Assert
    expect(component.config).toEqual(LEGAL_DOCS.privacy);
    expect(component.config.title).toBe('Privacy Policy');
    expect(component.config.pageTitle).toBe('Privacy Policy');
    expect(component.config.assetPath).toBe('assets/legal/privacy-policy.md');
    expect(component.config.lastUpdated).toBe('2026-02-15');
  });

  it('should pass correct inputs to legal-doc-page component', () => {
    // Arrange & Act
    const legalDocPageElement = fixture.debugElement.query(By.css('wil-legal-doc-page'));

    // Assert
    expect(legalDocPageElement).toBeTruthy();
    expect(legalDocPageElement.attributes['ng-reflect-title']).toBe('Privacy Policy');
    expect(legalDocPageElement.attributes['ng-reflect-asset-path']).toBe('assets/legal/privacy-policy.md');
    expect(legalDocPageElement.attributes['ng-reflect-last-updated']).toBe('2026-02-15');
    expect(legalDocPageElement.attributes['ng-reflect-page-title']).toBe('Privacy Policy');
  });

  it('should render privacy page data-testid', () => {
    // Arrange & Act
    const privacyPageElement = fixture.debugElement.query(By.css('[data-testid="privacy-page"]'));

    // Assert
    expect(privacyPageElement).toBeTruthy();
  });

  it('should load privacy policy content', () => {
    // Arrange
    const mockContent = '# Privacy Policy\n\nTest privacy content';

    // Act - expect HTTP request for privacy content
    const req = httpMock.expectOne('assets/legal/privacy-policy.md');
    expect(req.request.method).toBe('GET');
    req.flush(mockContent);

    fixture.detectChanges();

    // Assert - verify content is loaded (basic smoke test)
    // The actual content rendering is tested in LegalDocPageComponent
    expect(req.request.url).toBe('assets/legal/privacy-policy.md');
  });
});
