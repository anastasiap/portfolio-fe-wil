import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'wil-header-mobile-nav',
  standalone: true,
  imports: [MatSelectModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './mobile-nav.component.html',
  styleUrl: './mobile-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavComponent {
  public readonly isOpen = input.required<boolean>();
  public readonly links = input.required<NavLink[]>();
  public readonly isAuthenticated = input.required<boolean>();
  public readonly isSubscriptionNavigationRestricted = input.required<boolean>();
  public readonly locale = input.required<Locale>();
  public readonly languages = input.required<string[]>();
  public readonly labels = input.required<Record<string, string>>();

  public readonly closeMobileMenu = output<void>();
  public readonly navAction = output<NavAction>();
  public readonly localeChange = output<MatSelectChange>();

  public readonly shouldRenderStandardNav = computed(() => !this.isAuthenticated() || !this.isSubscriptionNavigationRestricted());

  public isRouteLink(link: NavLink): link is NavRouteLink {
    return link.route !== undefined;
  }

  public closeMenu(): void {
    this.closeMobileMenu.emit();
  }

  public handleNavAction(action: NavAction): void {
    this.navAction.emit(action);
  }

  public handleLocaleChange(event: MatSelectChange): void {
    this.localeChange.emit(event);
  }
}
