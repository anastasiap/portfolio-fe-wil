export interface NavigationItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly testId: string;
}

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Profile basics', path: 'profile', icon: 'person', testId: 'nav-item-profile' },
  { label: 'Subscription & Billing', path: 'subscription', icon: 'payment', testId: 'nav-item-subscription' },
  { label: 'GDPR & Privacy controls', path: 'privacy', icon: 'shield', testId: 'nav-item-privacy' },
  { label: 'Security', path: 'security', icon: 'lock', testId: 'nav-item-security' },
  { label: 'Contact & Support', path: 'support', icon: 'help', testId: 'nav-item-support' },
];

const signupCompletionPollingIntervalMs = 2000;
const signupCompletionPollingMaxDurationMs = 30000;

export const signupCompletionPollingConfig = {
  intervalMs: signupCompletionPollingIntervalMs,
  maxDurationMs: signupCompletionPollingMaxDurationMs,
  maxAttempts: signupCompletionPollingMaxDurationMs / signupCompletionPollingIntervalMs,
} as const;
