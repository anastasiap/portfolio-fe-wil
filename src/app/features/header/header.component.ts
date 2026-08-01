import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LocaleService, supportedLocales } from '../../services/i18n/locale.service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { combineLatest, filter, map, Observable, startWith } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectLang, selectMode } from '../../state';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HEADER_NAV_CONFIG } from '../../../configs/header-nav.config';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { selectIsAuthenticated, selectIsSubscriptionNavigationRestricted, selectPlan } from '../../state/auth/auth.selectors';
import * as AuthActions from '../../state/auth/auth.actions';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { AuthModalData } from '../auth-modal/auth-modal.types';
import { CtaButtonComponent } from '../../ui/cta-button/cta-button.component';
import { WheelSwitcherComponent } from './features/wheel-switcher/wheel-switcher.component';
import { MobileNavComponent } from './ui/mobile-nav/mobile-nav.component';

@Component({
  selector: 'wil-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
    TranslatePipe,
    FlexLayoutModule,
    RouterLink,
    RouterLinkActive,
    WheelSwitcherComponent,
    CtaButtonComponent,
    MobileNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly store = inject(Store);
  private readonly localeService = inject(LocaleService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  public readonly isMobileMenuOpen = signal(false);

  public readonly languages: string[] = supportedLocales;
  public readonly labels: Record<string, string> = {
    en: 'English',
    ru: 'Русский',
  };

  private readonly isWheelRoute$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
    startWith(this.router.url),
    map((url) => this.isWheelRoute(url))
  );

  public readonly vm$: Observable<HeaderViewModel> = combineLatest([
    this.store.select(selectLang),
    this.store.select(selectIsAuthenticated),
    this.store.select(selectPlan),
    this.store.select(selectIsSubscriptionNavigationRestricted),
    this.store.select(selectMode),
    this.isWheelRoute$,
  ]).pipe(
    map(([locale, isAuthenticated, planType, isSubscriptionNavigationRestricted, mode, isWheelRoute]) => {
      const effectivePlanType: ViewType = isAuthenticated && planType ? planType : 'noAuth';
      const links = HEADER_NAV_CONFIG[effectivePlanType];
      const isSwitcherPlan = planType === 'free' || planType === 'personal';

      return {
        links,
        planType: effectivePlanType,
        isAuthenticated,
        isSubscriptionNavigationRestricted,
        shouldShowSwitcher: isSwitcherPlan && isWheelRoute && mode !== 'edit',
        isEditMode: mode === 'edit',
        locale,
      };
    })
  );

  public setLocale(event: MatSelectChange): void {
    this.localeService.setLocale(event.value);
  }

  public isRouteLink(link: NavLink): link is NavRouteLink {
    return link.route !== undefined;
  }

  private isWheelRoute(url: string): boolean {
    const primaryRoute = this.router.parseUrl(url).root.children['primary'];

    return primaryRoute?.segments.some((segment) => segment.path === 'wheel') ?? false;
  }

  public handleNavAction(action: NavAction): void {
    switch (action) {
      case 'login':
        this.handleLogin();
        break;
      case 'logout':
        this.handleLogout();
        break;
      case 'language':
        // Language switching is handled by the dropdown, not this action
        break;
    }
  }

  private handleLogin(): void {
    const config: MatDialogConfig<AuthModalData> = {
      data: { initialView: 'login' },
      // minWidth: '650px',
      // maxWidth: '700px',
      autoFocus: false, // Prevent weird focus jumps
      disableClose: false, // Allow ESC and backdrop click
      panelClass: 'modal-panel',
    };

    this.dialog.open(AuthModalComponent, config);
  }

  private handleLogout(): void {
    this.store.dispatch(AuthActions.logoutRequested());
  }

  public toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  public closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  public handleMobileNavAction(action: NavAction): void {
    this.closeMobileMenu();
    this.handleNavAction(action);
  }
}
