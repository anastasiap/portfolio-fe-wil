import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectChange } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HeaderComponent } from './header.component';
import { WheelSwitcherComponent } from './features/wheel-switcher/wheel-switcher.component';
import { MobileNavComponent } from './ui/mobile-nav/mobile-nav.component';
import { selectIsAuthenticated, selectIsSubscriptionNavigationRestricted, selectPlan } from '../../state/auth/auth.selectors';
import { selectLang, selectMode } from '../../state';

type HeaderMode = 'edit' | 'view';

interface MockSelectorResult<T> {
  setResult(result: T): void;
}

@Component({ selector: 'wil-wheel-switcher', template: '', standalone: true })
class WheelSwitcherStubComponent {}

@Component({ selector: 'wil-header-mobile-nav', template: '', standalone: true })
class MobileNavStubComponent {
  @Input() public isOpen = false;
  @Input() public links: NavLink[] = [];
  @Input() public isAuthenticated = false;
  @Input() public isSubscriptionNavigationRestricted = false;
  @Input() public locale: Locale = 'en';
  @Input() public languages: string[] = [];
  @Input() public labels: Record<string, string> = {};

  @Output() public readonly closeMobileMenu = new EventEmitter<void>();
  @Output() public readonly navAction = new EventEmitter<NavAction>();
  @Output() public readonly localeChange = new EventEmitter<MatSelectChange>();
}

describe('HeaderComponent - Logo Rendering', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockStore: MockStore;
  let selectIsAuthenticatedMock: MockSelectorResult<boolean>;
  let selectPlanMock: MockSelectorResult<PlanType | undefined>;
  let selectIsSubscriptionNavigationRestrictedMock: MockSelectorResult<boolean>;
  let selectModeMock: MockSelectorResult<HeaderMode>;
  let selectLangMock: MockSelectorResult<Locale>;
  let currentUrl: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideMockStore({
          initialState: {},
        }),
      ],
    })
      .overrideComponent(HeaderComponent, {
        remove: { imports: [WheelSwitcherComponent, MobileNavComponent] },
        add: { imports: [WheelSwitcherStubComponent, MobileNavStubComponent] },
      })
      .compileComponents();

    mockStore = TestBed.inject(MockStore);
    currentUrl = '/app/wheel';
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.callFake(() => currentUrl);

    // Override all selectors used by the component to prevent
    // derived selectors throwing on an empty initial state.
    selectIsAuthenticatedMock = mockStore.overrideSelector(selectIsAuthenticated, false);
    selectPlanMock = mockStore.overrideSelector<typeof selectPlan, undefined, PlanType | undefined>(selectPlan, undefined);
    selectLangMock = mockStore.overrideSelector(selectLang, 'en' as Locale);
    selectModeMock = mockStore.overrideSelector(selectMode, 'view');
    selectIsSubscriptionNavigationRestrictedMock = mockStore.overrideSelector(selectIsSubscriptionNavigationRestricted, false);

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockStore.resetSelectors();
  });

  function getMobileNav(): MobileNavStubComponent {
    return fixture.debugElement.query(By.directive(MobileNavStubComponent)).componentInstance as MobileNavStubComponent;
  }

  describe('when unauthenticated', () => {
    it('should render the logo as an anchor element with data-testid="header-logo"', () => {
      // Arrange - selectIsAuthenticated already false from beforeEach

      // Act
      const anchor = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));

      // Assert
      expect(anchor).toBeTruthy();
      expect(anchor.nativeElement.tagName.toLowerCase()).toBe('a');
    });

    it('should not render the logo without a link', () => {
      // Arrange - selectIsAuthenticated already false from beforeEach

      // Act
      const span = fixture.debugElement.query(By.css('[data-testid="header-logo-no-link"]'));

      // Assert
      expect(span).toBeNull();
    });

    it('should have routerLink pointing to the home route "/"', () => {
      // Arrange - selectIsAuthenticated already false from beforeEach

      // Act
      const anchor = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));

      // Assert
      expect(anchor.attributes['ng-reflect-router-link']).toBe('/');
    });

    it('should display the siteTitle translation key', () => {
      // Arrange - selectIsAuthenticated already false from beforeEach

      // Act
      const anchor = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));

      // Assert
      expect(anchor.nativeElement.textContent.trim()).toBe('siteTitle');
    });
  });

  describe('wheel-switcher container visibility', () => {
    it('should render the wheel-switcher container when userPlanType is free', () => {
      // Arrange
      selectPlanMock.setResult('free');
      selectIsAuthenticatedMock.setResult(true);
      mockStore.refreshState();

      // Act
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeTruthy();
    });

    it('should render the wheel-switcher container when userPlanType is personal', () => {
      // Arrange
      selectPlanMock.setResult('personal');
      selectIsAuthenticatedMock.setResult(true);
      mockStore.refreshState();

      // Act
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeTruthy();
    });

    it('should not render the wheel-switcher container outside the wheel route', () => {
      // Arrange
      currentUrl = '/app/dashboard';
      selectPlanMock.setResult('personal');
      selectIsAuthenticatedMock.setResult(true);
      mockStore.refreshState();
      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance;

      // Act
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeNull();
    });

    it('should not render the wheel-switcher container when user is not authenticated', () => {
      // Arrange
      selectIsAuthenticatedMock.setResult(false);
      mockStore.refreshState();

      // Act
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeNull();
    });

    it('should not render the wheel-switcher container when userPlanType is professional', () => {
      // Arrange
      selectPlanMock.setResult('professional');
      selectIsAuthenticatedMock.setResult(true);
      mockStore.refreshState();

      // Act
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeNull();
    });

    it('should not render the wheel-switcher container when userPlanType is null', () => {
      // Arrange - selectPlan already null from beforeEach

      // Act
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeNull();
    });

    it('should not render the wheel-switcher container while edit mode is active', () => {
      // Arrange
      selectPlanMock.setResult('personal');
      selectIsAuthenticatedMock.setResult(true);
      selectModeMock.setResult('edit');
      mockStore.refreshState();

      // Act
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'));

      // Assert
      expect(container).toBeNull();
    });
  });

  describe('hamburger button', () => {
    it('should render the hamburger button', () => {
      // Act
      const button = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"]'));

      // Assert
      expect(button).toBeTruthy();
    });

    it('should have aria-expanded="false" when mobile menu is closed', () => {
      // Arrange - isMobileMenuOpen is false by default

      // Act
      const button = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"]'));

      // Assert
      expect(button.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show "menu" icon when mobile menu is closed', () => {
      // Arrange - isMobileMenuOpen is false by default

      // Act
      const icon = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"] mat-icon'));

      // Assert
      expect(icon.nativeElement.textContent.trim()).toBe('menu');
    });

    it('should set aria-expanded="true" and show "close" icon after click', () => {
      // Arrange
      const button = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"]'));

      // Act
      button.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(button.nativeElement.getAttribute('aria-expanded')).toBe('true');
      const icon = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"] mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('close');
    });

    it('should close the menu and restore "menu" icon on second click', () => {
      // Arrange
      const button = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"]'));
      button.nativeElement.click();
      fixture.detectChanges();

      // Act
      button.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(button.nativeElement.getAttribute('aria-expanded')).toBe('false');
      const icon = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"] mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('menu');
    });
  });

  describe('dynamic state changes', () => {
    it('should update logo, desktop nav, and mobile nav inputs when authentication and plan change', () => {
      expect(fixture.debugElement.query(By.css('[data-testid="header-logo"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="nav-home"]'))).toBeTruthy();
      expect(getMobileNav().isAuthenticated).toBeFalse();
      expect(getMobileNav().links.some((link) => link.testId === 'nav-home')).toBeTrue();

      selectIsAuthenticatedMock.setResult(true);
      selectPlanMock.setResult('free');
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="header-logo"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="header-logo-no-link"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="nav-home"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="personal-home"]'))).toBeTruthy();
      expect(getMobileNav().isAuthenticated).toBeTrue();
      expect(getMobileNav().links.some((link) => link.testId === 'personal-home')).toBeTrue();
    });

    it('should react when subscription navigation restriction changes after initial render', () => {
      selectIsAuthenticatedMock.setResult(true);
      selectPlanMock.setResult('personal');
      selectIsSubscriptionNavigationRestrictedMock.setResult(false);
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="personal-home"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-profile"]'))).toBeNull();
      expect(getMobileNav().isSubscriptionNavigationRestricted).toBeFalse();

      selectIsSubscriptionNavigationRestrictedMock.setResult(true);
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="personal-home"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-profile"]'))).toBeTruthy();
      expect(getMobileNav().isSubscriptionNavigationRestricted).toBeTrue();

      selectIsSubscriptionNavigationRestrictedMock.setResult(false);
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="personal-home"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-profile"]'))).toBeNull();
      expect(getMobileNav().isSubscriptionNavigationRestricted).toBeFalse();
    });

    it('should hide and show the wheel switcher when edit mode changes', () => {
      selectIsAuthenticatedMock.setResult(true);
      selectPlanMock.setResult('personal');
      selectModeMock.setResult('view');
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'))).toBeTruthy();

      selectModeMock.setResult('edit');
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'))).toBeNull();

      selectModeMock.setResult('view');
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="header-wheel-switcher-container"]'))).toBeTruthy();
    });

    it('should update the mobile nav locale input when the selected language changes', () => {
      expect(getMobileNav().locale).toBe('en');

      selectLangMock.setResult('ru');
      mockStore.refreshState();
      fixture.detectChanges();

      expect(getMobileNav().locale).toBe('ru');
    });

    it('should update mobile nav open input and close when the child emits close', () => {
      const button = fixture.debugElement.query(By.css('[data-testid="header-hamburger-button"]'));

      button.nativeElement.click();
      fixture.detectChanges();

      expect(getMobileNav().isOpen).toBeTrue();

      getMobileNav().closeMobileMenu.emit();
      fixture.detectChanges();

      expect(component.isMobileMenuOpen()).toBeFalse();
      expect(getMobileNav().isOpen).toBeFalse();
      expect(button.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close the mobile menu and dispatch logout when the child emits logout', () => {
      spyOn(mockStore, 'dispatch');
      component.toggleMobileMenu();
      fixture.detectChanges();

      getMobileNav().navAction.emit('logout');
      fixture.detectChanges();

      expect(component.isMobileMenuOpen()).toBeFalse();
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
    });

    it('should forward mobile locale changes to setLocale', () => {
      spyOn(component, 'setLocale');
      const event = { value: 'ru' } as MatSelectChange;

      getMobileNav().localeChange.emit(event);

      expect(component.setLocale).toHaveBeenCalledOnceWith(event);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      // Arrange
      selectIsAuthenticatedMock.setResult(true);
      mockStore.refreshState();
      fixture.detectChanges();
    });

    it('should render the logo without a link element with data-testid="header-logo-no-link"', () => {
      // Act
      const span = fixture.debugElement.query(By.css('[data-testid="header-logo-no-link"]'));

      // Assert
      expect(span).toBeTruthy();
      expect(span.nativeElement.tagName.toLowerCase()).toBe('span');
    });

    it('should not render the anchor logo', () => {
      // Act
      const anchor = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));

      // Assert
      expect(anchor).toBeNull();
    });

    it('should display the siteTitlePersonal translation key', () => {
      // Act
      const span = fixture.debugElement.query(By.css('[data-testid="header-logo-no-link"]'));

      // Assert
      expect(span.nativeElement.textContent.trim()).toBe('siteTitlePersonal');
    });
  });

  describe('desktop nav - subscription guard', () => {
    beforeEach(() => {
      selectIsAuthenticatedMock.setResult(true);
      selectPlanMock.setResult('personal');
    });

    it('should render normal plan navigation when subscription navigation is not restricted', () => {
      selectIsSubscriptionNavigationRestrictedMock.setResult(false);
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="personal-home"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-profile"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-logout"]'))).toBeNull();
    });

    it('should render only profile and logout when subscription navigation is restricted', () => {
      selectIsSubscriptionNavigationRestrictedMock.setResult(true);
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('[data-testid="personal-home"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-profile"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="subscription-canceled-nav-logout"]'))).toBeTruthy();
    });
  });

  describe('desktop nav route links', () => {
    describe('when unauthenticated (noAuth config)', () => {
      // Default setup: isAuthenticated=false -> noAuth nav config
      // Route links: nav-home, nav-pricing, nav-professionals, nav-blog, nav-about
      // Action links (not rendered as <a>): nav-language, nav-auth

      it('should render all route-based nav links', () => {
        // Act
        const links = fixture.debugElement.queryAll(By.css('nav.header__nav a.header__nav-link'));

        // Assert - 5 route entries in noAuth config
        expect(links.length).toBe(5);
      });

      it('should render nav-home link with routerLink "/"', () => {
        // Act
        const homeLink = fixture.debugElement.query(By.css('[data-testid="nav-home"]'));

        // Assert
        expect(homeLink).toBeTruthy();
        expect(homeLink.attributes['ng-reflect-router-link']).toBe('/');
      });

      it('should render nav-pricing link with routerLink "/plans"', () => {
        // Act
        const pricingLink = fixture.debugElement.query(By.css('[data-testid="nav-pricing"]'));

        // Assert
        expect(pricingLink).toBeTruthy();
        expect(pricingLink.attributes['ng-reflect-router-link']).toBe('/plans');
      });

      it('should display the translated label on each route link', () => {
        // Act
        const blogLink = fixture.debugElement.query(By.css('[data-testid="nav-blog"]'));

        // Assert - TranslateModule.forRoot() with no loader passes keys through
        expect(blogLink.nativeElement.textContent.trim()).toBe('blog');
      });

      it('should not add the accent class when link.className is falsy', () => {
        // Arrange - nav-professionals has className: '' (falsy)
        const profLink = fixture.debugElement.query(By.css('[data-testid="nav-professionals"]'));

        // Assert
        expect(profLink.nativeElement.classList).not.toContain('accent');
      });

      it('should not render action-based links as anchor elements', () => {
        // Act - nav-auth and nav-language are action links, not route links
        const authAnchor = fixture.debugElement.query(By.css('a[data-testid="nav-auth"]'));
        const langAnchor = fixture.debugElement.query(By.css('a[data-testid="nav-language"]'));

        // Assert
        expect(authAnchor).toBeNull();
        expect(langAnchor).toBeNull();
      });
    });

    describe('when authenticated with free plan', () => {
      beforeEach(() => {
        // Arrange - free plan nav: personal-home, nav-dashboard, nav-profile (route) + nav-logout (action)
        selectIsAuthenticatedMock.setResult(true);
        selectPlanMock.setResult('free');
        mockStore.refreshState();
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

      it('should render route-based links for the Free plan', () => {
        // Act
        const links = fixture.debugElement.queryAll(By.css('nav.header__nav a.header__nav-link'));

        // Assert - 3 route entries in free config (personal-home, nav-dashboard, nav-profile)
        expect(links.length).toBe(3);
      });

      it('should render the personal-home link with routerLink "app/wheel"', () => {
        // Act
        const homeLink = fixture.debugElement.query(By.css('[data-testid="personal-home"]'));

        // Assert
        expect(homeLink).toBeTruthy();
        expect(homeLink.attributes['ng-reflect-router-link']).toBe('app/wheel');
      });

      it('should render the profile link with routerLink "app/account/profile"', () => {
        // Act
        const profileLink = fixture.debugElement.query(By.css('[data-testid="nav-profile"]'));

        // Assert
        expect(profileLink).toBeTruthy();
        expect(profileLink.attributes['ng-reflect-router-link']).toBe('app/account/profile');
      });

      it('should not render noAuth-specific links', () => {
        // Act
        const homeLink = fixture.debugElement.query(By.css('[data-testid="nav-home"]'));
        const pricingLink = fixture.debugElement.query(By.css('[data-testid="nav-pricing"]'));

        // Assert
        expect(homeLink).toBeNull();
        expect(pricingLink).toBeNull();
      });
    });

    describe('when authenticated with Personal plan', () => {
      beforeEach(() => {
        // Arrange - personal plan nav: personal-home, nav-dashboard, nav-profile (route) + nav-logout (action)
        selectIsAuthenticatedMock.setResult(true);
        selectPlanMock.setResult('personal');
        mockStore.refreshState();
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

      it('should render route-based links for the Personal plan', () => {
        // Act
        const links = fixture.debugElement.queryAll(By.css('nav.header__nav a.header__nav-link'));

        // Assert - 3 route entries in personal config (personal-home, nav-dashboard, nav-profile)
        expect(links.length).toBe(3);
      });

      it('should render the personal-home link with routerLink "app/wheel"', () => {
        // Act
        const homeLink = fixture.debugElement.query(By.css('[data-testid="personal-home"]'));

        // Assert
        expect(homeLink).toBeTruthy();
        expect(homeLink.attributes['ng-reflect-router-link']).toBe('app/wheel');
      });

      it('should render the profile link with routerLink "app/account/profile"', () => {
        // Act
        const profileLink = fixture.debugElement.query(By.css('[data-testid="nav-profile"]'));

        // Assert
        expect(profileLink).toBeTruthy();
        expect(profileLink.attributes['ng-reflect-router-link']).toBe('app/account/profile');
      });

      it('should not render noAuth-specific links', () => {
        // Act
        const homeLink = fixture.debugElement.query(By.css('[data-testid="nav-home"]'));
        const pricingLink = fixture.debugElement.query(By.css('[data-testid="nav-pricing"]'));

        // Assert
        expect(homeLink).toBeNull();
        expect(pricingLink).toBeNull();
      });
    });
  });

  describe('desktop nav action buttons', () => {
    describe('login button (noAuth config)', () => {
      it('should render the login action as wil-cta-button, not as an anchor', () => {
        // Act - noAuth config has action:'login' entry (nav-auth)
        const loginAnchor = fixture.debugElement.query(By.css('a[data-testid="nav-auth"]'));
        const loginBtn = fixture.debugElement.query(By.css('[data-testid="nav-auth"]'));

        // Assert
        expect(loginAnchor).toBeNull();
        expect(loginBtn).toBeTruthy();
      });

      it('should call handleNavAction with "login" when the login button emits ctaClick', () => {
        // Arrange
        spyOn(component, 'handleNavAction');
        const loginBtn = fixture.debugElement.query(By.css('[data-testid="nav-auth"]'));

        // Act
        loginBtn.triggerEventHandler('ctaClick', null);

        // Assert
        expect(component.handleNavAction).toHaveBeenCalledWith('login');
      });
    });

    describe('language switcher (noAuth config)', () => {
      it('should render the language switcher container', () => {
        // Act
        const langSwitcher = fixture.debugElement.query(By.css('[data-testid="header-navigation-language-switcher"]'));

        // Assert
        expect(langSwitcher).toBeTruthy();
      });

      it('should render the mat-select inside the language switcher', () => {
        // Act
        const matSelect = fixture.debugElement.query(By.css('[data-testid="header-navigation-language-switcher-mat-select"]'));

        // Assert
        expect(matSelect).toBeTruthy();
      });

      it('should call setLocale when the mat-select selection changes', () => {
        // Arrange
        spyOn(component, 'setLocale');
        const matSelect = fixture.debugElement.query(By.css('[data-testid="header-navigation-language-switcher-mat-select"]'));

        // Act
        matSelect.triggerEventHandler('selectionChange', { value: 'ru' });

        // Assert
        expect(component.setLocale).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'ru' }));
      });
    });

    describe('logout button (free plan)', () => {
      beforeEach(() => {
        // Arrange - free plan config includes action:'logout' (nav-logout)
        selectIsAuthenticatedMock.setResult(true);
        selectPlanMock.setResult('free');
        mockStore.refreshState();
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

      it('should render the logout action as wil-cta-button, not as an anchor', () => {
        // Act
        const logoutAnchor = fixture.debugElement.query(By.css('a[data-testid="nav-logout"]'));
        const logoutBtn = fixture.debugElement.query(By.css('[data-testid="nav-logout"]'));

        // Assert
        expect(logoutAnchor).toBeNull();
        expect(logoutBtn).toBeTruthy();
      });

      it('should call handleNavAction with "logout" when the logout button emits ctaClick', () => {
        // Arrange
        spyOn(component, 'handleNavAction');
        const logoutBtn = fixture.debugElement.query(By.css('[data-testid="nav-logout"]'));

        // Act
        logoutBtn.triggerEventHandler('ctaClick', null);

        // Assert
        expect(component.handleNavAction).toHaveBeenCalledWith('logout');
      });

      it('should dispatch logoutRequested when handleNavAction is called with "logout"', () => {
        // Arrange
        spyOn(mockStore, 'dispatch');

        // Act - call the public method directly (pure side-effect: dispatches action)
        component.handleNavAction('logout');

        // Assert
        expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('language switcher - site title translation', () => {
    let translateService: TranslateService;

    beforeEach(() => {
      // Arrange - seed both locales into the in-memory translation store
      translateService = TestBed.inject(TranslateService);
      translateService.setTranslation('en', { siteTitle: 'Wheel of Life' }, true);
      translateService.setTranslation('ru', { siteTitle: 'Колесо баланса' }, true);
      translateService.use('en');
      fixture.detectChanges();
    });

    it('should display "Wheel of Life" when the language is English', fakeAsync(() => {
      // Act
      translateService.use('en');
      tick();
      fixture.detectChanges();

      // Assert
      const logo = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));
      expect(logo.nativeElement.textContent.trim()).toBe('Wheel of Life');
    }));

    it('should display "Колесо баланса" after switching to Russian', fakeAsync(() => {
      // Act
      translateService.use('ru');
      tick();
      fixture.detectChanges();

      // Assert
      const logo = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));
      expect(logo.nativeElement.textContent.trim()).toBe('Колесо баланса');
    }));

    it('should display "Wheel of Life" again after switching back to English', fakeAsync(() => {
      // Arrange - switch to Russian first
      translateService.use('ru');
      tick();
      fixture.detectChanges();
      const logoRu = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));
      expect(logoRu.nativeElement.textContent.trim()).toBe('Колесо баланса');

      // Act - switch back to English
      translateService.use('en');
      tick();
      fixture.detectChanges();

      // Assert
      const logo = fixture.debugElement.query(By.css('[data-testid="header-logo"]'));
      expect(logo.nativeElement.textContent.trim()).toBe('Wheel of Life');
    }));
  });
});
