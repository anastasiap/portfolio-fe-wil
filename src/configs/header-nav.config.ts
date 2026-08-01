import { BASE, PERSONAL_HOME_ROUTE, PROFESSIONAL_HOME_ROUTE } from './routes.config';

export const HEADER_NAV_CONFIG: Record<ViewType, NavLink[]> = {
  noAuth: [
    { label: 'home', route: '/', testId: 'nav-home' },
    { label: 'plans', route: '/plans', testId: 'nav-pricing' },
    { label: 'integration', route: '/for-coaches', testId: 'nav-professionals', className: '' },
    { label: 'blog', route: '/blog', testId: 'nav-blog' },
    { label: 'aboutMe', route: '/about', testId: 'nav-about' },
    { label: 'Language Switch', action: 'language', testId: 'nav-language' },
    { label: 'login', action: 'login', testId: 'nav-auth' },
  ],
  free: [
    { label: 'personalHome', route: PERSONAL_HOME_ROUTE, testId: 'personal-home' },
    { label: 'sessions', route: `${BASE}/dashboard`, testId: 'nav-dashboard' },
    { label: 'profile', route: `${BASE}/account/profile`, testId: 'nav-profile' },
    { label: 'logout', action: 'logout', testId: 'nav-logout' },
  ],
  personal: [
    { label: 'personalHome', route: PERSONAL_HOME_ROUTE, testId: 'personal-home' },
    { label: 'sessions', route: `${BASE}/dashboard`, testId: 'nav-dashboard' },
    { label: 'profile', route: `${BASE}/account/profile`, testId: 'nav-profile' },
    { label: 'wheel-switcher', action: `wheel-switch`, testId: 'nav-wheel-switcher' },
    { label: 'logout', action: 'logout', testId: 'nav-logout' },
  ],
  professional: [
    { label: 'Workplace', route: PROFESSIONAL_HOME_ROUTE, testId: 'nav-workplace' },
    { label: 'Profile', route: `${BASE}/account/profile`, testId: 'nav-profile' },
    { label: 'Logout', action: 'logout', testId: 'nav-logout' },
  ],
};
