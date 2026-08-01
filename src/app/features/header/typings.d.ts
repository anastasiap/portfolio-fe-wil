interface NavLinkBase {
  label: string;
  className?: string;
  testId: string;
}

type NavAction = 'login' | 'logout' | 'language' | 'wheel-switch';

interface NavRouteLink extends NavLinkBase {
  route: string;
  action?: never;
}

interface NavActionLink extends NavLinkBase {
  action: NavAction;
  route?: never;
}

type NavLink = NavRouteLink | NavActionLink;

type ViewType = 'noAuth' | 'free' | 'personal' | 'professional';

interface HeaderViewModel {
  links: NavLink[];
  planType: ViewType;
  isAuthenticated: boolean;
  isSubscriptionNavigationRestricted: boolean;
  shouldShowSwitcher: boolean;
  isEditMode: boolean;
  locale: Locale;
}
