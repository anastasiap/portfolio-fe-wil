import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSelectChange } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { MobileNavComponent } from './mobile-nav.component';

describe('MobileNavComponent', () => {
  let component: MobileNavComponent;
  let fixture: ComponentFixture<MobileNavComponent>;

  const standardLinks: NavLink[] = [
    { label: 'home', route: '/', testId: 'nav-home' },
    { label: 'plans', route: '/plans', testId: 'nav-pricing', className: 'accent' },
    { label: 'Language Switch', action: 'language', testId: 'nav-language' },
    { label: 'login', action: 'login', testId: 'nav-auth' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileNavComponent, RouterTestingModule, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileNavComponent);
    component = fixture.componentInstance;
    setInputs();
    fixture.detectChanges();
  });

  function setInputs(
    overrides: Partial<{
      isOpen: boolean;
      links: NavLink[];
      isAuthenticated: boolean;
      isSubscriptionNavigationRestricted: boolean;
      locale: Locale;
      languages: string[];
      labels: Record<string, string>;
    }> = {}
  ): void {
    fixture.componentRef.setInput('isOpen', overrides.isOpen ?? false);
    fixture.componentRef.setInput('links', overrides.links ?? standardLinks);
    fixture.componentRef.setInput('isAuthenticated', overrides.isAuthenticated ?? false);
    fixture.componentRef.setInput('isSubscriptionNavigationRestricted', overrides.isSubscriptionNavigationRestricted ?? false);
    fixture.componentRef.setInput('locale', overrides.locale ?? 'en');
    fixture.componentRef.setInput('languages', overrides.languages ?? ['en', 'ru']);
    fixture.componentRef.setInput('labels', overrides.labels ?? { en: 'English', ru: 'Русский' });
  }

  it('should apply the open class when the menu is open', () => {
    setInputs({ isOpen: true });
    fixture.detectChanges();

    const menu = fixture.debugElement.query(By.css('[data-testid="header-mobile-menu"]'));

    expect(menu.nativeElement.classList).toContain('header__mobile-menu--open');
  });

  it('should render standard route links, action buttons, and language switcher', () => {
    const homeLink = fixture.debugElement.query(By.css('[data-testid="mobile-nav-home"]'));
    const pricingLink = fixture.debugElement.query(By.css('[data-testid="mobile-nav-pricing"]'));
    const loginButton = fixture.debugElement.query(By.css('[data-testid="mobile-nav-auth"]'));
    const languageSwitcher = fixture.debugElement.query(By.css('[data-testid="mobile-header-navigation-language-switcher"]'));
    const restrictedProfileLink = fixture.debugElement.query(By.css('[data-testid="mobile-subscription-canceled-nav-profile"]'));

    expect(homeLink).toBeTruthy();
    expect(homeLink.attributes['ng-reflect-router-link']).toBe('/');
    expect(pricingLink.nativeElement.classList).toContain('accent');
    expect(loginButton).toBeTruthy();
    expect(languageSwitcher).toBeTruthy();
    expect(restrictedProfileLink).toBeNull();
  });

  it('should emit close when a standard route link is clicked', () => {
    spyOn(component.closeMobileMenu, 'emit');
    const homeLink = fixture.debugElement.query(By.css('[data-testid="mobile-nav-home"]'));

    homeLink.nativeElement.click();

    expect(component.closeMobileMenu.emit).toHaveBeenCalledTimes(1);
  });

  it('should emit navAction when a standard action button is clicked', () => {
    spyOn(component.navAction, 'emit');
    const loginButton = fixture.debugElement.query(By.css('[data-testid="mobile-nav-auth"]'));

    loginButton.nativeElement.click();

    expect(component.navAction.emit).toHaveBeenCalledOnceWith('login');
  });

  it('should emit localeChange when the language selection changes', () => {
    spyOn(component.localeChange, 'emit');
    const event = { value: 'ru' } as MatSelectChange;
    const matSelect = fixture.debugElement.query(By.css('[data-testid="mobile-header-navigation-language-switcher-mat-select"]'));

    matSelect.triggerEventHandler('selectionChange', event);

    expect(component.localeChange.emit).toHaveBeenCalledOnceWith(event);
  });

  it('should render restricted subscription navigation for authenticated restricted users', () => {
    setInputs({
      isAuthenticated: true,
      isSubscriptionNavigationRestricted: true,
    });
    fixture.detectChanges();

    const standardHomeLink = fixture.debugElement.query(By.css('[data-testid="mobile-nav-home"]'));
    const profileLink = fixture.debugElement.query(By.css('[data-testid="mobile-subscription-canceled-nav-profile"]'));
    const logoutButton = fixture.debugElement.query(By.css('[data-testid="mobile-subscription-canceled-nav-logout"]'));

    expect(standardHomeLink).toBeNull();
    expect(profileLink).toBeTruthy();
    expect(profileLink.attributes['ng-reflect-router-link']).toBe('app/account/profile');
    expect(logoutButton).toBeTruthy();
  });

  it('should emit close from the restricted profile link', () => {
    setInputs({
      isAuthenticated: true,
      isSubscriptionNavigationRestricted: true,
    });
    fixture.detectChanges();
    spyOn(component.closeMobileMenu, 'emit');
    const profileLink = fixture.debugElement.query(By.css('[data-testid="mobile-subscription-canceled-nav-profile"]'));

    profileLink.nativeElement.click();

    expect(component.closeMobileMenu.emit).toHaveBeenCalledTimes(1);
  });

  it('should emit logout from the restricted logout button', () => {
    setInputs({
      isAuthenticated: true,
      isSubscriptionNavigationRestricted: true,
    });
    fixture.detectChanges();
    spyOn(component.navAction, 'emit');
    const logoutButton = fixture.debugElement.query(By.css('[data-testid="mobile-subscription-canceled-nav-logout"]'));

    logoutButton.nativeElement.click();

    expect(component.navAction.emit).toHaveBeenCalledOnceWith('logout');
  });
});
