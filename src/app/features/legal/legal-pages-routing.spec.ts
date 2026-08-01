import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { provideMarkdown } from 'ngx-markdown';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TermsPageComponent } from './terms-page/terms-page.component';
import { PrivacyPageComponent } from './privacy-page/privacy-page.component';

// Test host component
@Component({
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [RouterOutlet],
})
class TestHostComponent {}

describe('Legal Pages Routing', () => {
  let router: Router;
  let location: Location;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'terms', component: TermsPageComponent },
          { path: 'privacy', component: PrivacyPageComponent },
          { path: '', redirectTo: '/terms', pathMatch: 'full' },
        ]),
        provideMarkdown(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(TestHostComponent);
  });

  it('should navigate to /terms and render TermsPageComponent', async () => {
    // Act
    await router.navigate(['/terms']);
    fixture.detectChanges();

    // Assert
    expect(location.path()).toBe('/terms');
    // The component should be rendered in the router-outlet
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('wil-terms-page')).toBeTruthy();
  });

  it('should navigate to /privacy and render PrivacyPageComponent', async () => {
    // Act
    await router.navigate(['/privacy']);
    fixture.detectChanges();

    // Assert
    expect(location.path()).toBe('/privacy');
    // The component should be rendered in the router-outlet
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('wil-privacy-page')).toBeTruthy();
  });

  it('should support direct URL navigation (hard refresh simulation)', async () => {
    // Act - simulate typing URL directly
    await router.navigateByUrl('/terms');
    fixture.detectChanges();

    // Assert
    expect(location.path()).toBe('/terms');
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('wil-terms-page')).toBeTruthy();
  });

  it('should support navigation between legal pages', async () => {
    // Arrange - start at terms
    await router.navigate(['/terms']);
    fixture.detectChanges();
    expect(location.path()).toBe('/terms');

    // Act - navigate to privacy
    await router.navigate(['/privacy']);
    fixture.detectChanges();

    // Assert
    expect(location.path()).toBe('/privacy');
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('wil-privacy-page')).toBeTruthy();

    // Act - navigate back to terms
    await router.navigate(['/terms']);
    fixture.detectChanges();

    // Assert
    expect(location.path()).toBe('/terms');
    expect(compiled.querySelector('wil-terms-page')).toBeTruthy();
  });
});
