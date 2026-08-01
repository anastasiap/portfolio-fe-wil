import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMarkdown } from 'ngx-markdown';
import { By } from '@angular/platform-browser';

import { CookiesPageComponent } from './cookies-page.component';
import { LegalDocPageComponent } from '../legal-doc-page/legal-doc-page.component';
import { LEGAL_DOCS } from '../legal-docs.constants';

describe('CookiesPageComponent', () => {
  let component: CookiesPageComponent;
  let fixture: ComponentFixture<CookiesPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiesPageComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideMarkdown()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CookiesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.match('assets/legal/cookies.md').forEach((req) => req.flush(''));
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render cookies page data-testid', () => {
    // Arrange & Act
    const cookiesPageElement = fixture.debugElement.query(By.css('[data-testid="cookies-page"]'));

    // Assert
    expect(cookiesPageElement).toBeTruthy();
  });

  it('should render legal doc page component', () => {
    // Arrange & Act
    const legalDocPageElement = fixture.debugElement.query(By.directive(LegalDocPageComponent));

    // Assert
    expect(legalDocPageElement).toBeTruthy();
  });

  it('should pass cookies configuration to legal doc page', () => {
    // Arrange & Act
    const legalDocPageElement = fixture.debugElement.query(By.directive(LegalDocPageComponent));
    const legalDocPageComponent = legalDocPageElement.componentInstance as LegalDocPageComponent;

    // Assert
    expect(legalDocPageComponent.title()).toBe(LEGAL_DOCS.cookies.title);
    expect(legalDocPageComponent.assetPath()).toBe(LEGAL_DOCS.cookies.assetPath);
    expect(legalDocPageComponent.lastUpdated()).toBe(LEGAL_DOCS.cookies.lastUpdated);
    expect(legalDocPageComponent.pageTitle()).toBe(LEGAL_DOCS.cookies.pageTitle);
  });
});
