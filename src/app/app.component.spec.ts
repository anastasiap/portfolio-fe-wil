import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';

@Component({ selector: 'wil-header', standalone: true, template: '' })
class HeaderStubComponent {}

@Component({ selector: 'wil-footer', standalone: true, template: '' })
class FooterStubComponent {}

@Component({ standalone: true, template: '' })
class RouteStubComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule.withRoutes([
          { path: 'hide-header', component: RouteStubComponent, data: { hideHeader: true } },
          { path: 'hide-footer', component: RouteStubComponent, data: { hideFooter: true } },
        ]),
      ],
    })
      .overrideComponent(AppComponent, {
        set: {
          imports: [CommonModule, RouterModule, HeaderStubComponent, FooterStubComponent],
          providers: [],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  describe('template rendering', () => {
    it('should render app root element', () => {
      const appRoot = fixture.debugElement.query(By.css('[data-testid="app-root"]'));

      expect(appRoot).toBeTruthy();
      expect(appRoot.nativeElement.tagName.toLowerCase()).toBe('div');
      expect(appRoot.nativeElement).toHaveClass('app');
    });

    it('should render app content main element', () => {
      const appContent = fixture.debugElement.query(By.css('[data-testid="app-content"]'));

      expect(appContent).toBeTruthy();
      expect(appContent.nativeElement.tagName.toLowerCase()).toBe('main');
      expect(appContent.nativeElement).toHaveClass('app__content');
    });

    it('should render router outlet inside app content', () => {
      const routerOutlet = fixture.debugElement.query(By.css('[data-testid="app-content"] router-outlet'));

      expect(routerOutlet).toBeTruthy();
      expect(routerOutlet.nativeElement.tagName.toLowerCase()).toBe('router-outlet');
    });

    it('should render header by default', () => {
      const header = fixture.debugElement.query(By.css('[data-testid="app-header"]'));

      expect(header).toBeTruthy();
      expect(header.nativeElement.tagName.toLowerCase()).toBe('wil-header');
    });

    it('should render footer by default', () => {
      const footer = fixture.debugElement.query(By.css('[data-testid="app-footer"]'));

      expect(footer).toBeTruthy();
      expect(footer.nativeElement.tagName.toLowerCase()).toBe('wil-footer');
    });

    it('should not render header when leaf route data has hideHeader', fakeAsync(() => {
      fixture.ngZone!.run(() => router.navigateByUrl('/hide-header'));
      tick();
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('[data-testid="app-header"]'));
      const footer = fixture.debugElement.query(By.css('[data-testid="app-footer"]'));

      expect(header).toBeNull();
      expect(footer).toBeTruthy();
    }));

    it('should not render footer when leaf route data has hideFooter', fakeAsync(() => {
      fixture.ngZone!.run(() => router.navigateByUrl('/hide-footer'));
      tick();
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('[data-testid="app-header"]'));
      const footer = fixture.debugElement.query(By.css('[data-testid="app-footer"]'));

      expect(header).toBeTruthy();
      expect(footer).toBeNull();
    }));
  });
});
