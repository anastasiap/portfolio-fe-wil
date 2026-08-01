interface GetMySubscriptionResponseDto {
  planCode: 'free' | 'personal' | 'professional';
  planLabel: string;
  status: 'free' | 'active' | 'trial' | 'trialing' | 'cancelling' | 'cancelled' | 'canceled' | 'payment_issue' | 'unknown';
  billingInterval: 'month' | 'year' | null;
  currency: string | null;
  priceCents: number;
  currentPeriodEnd: string | null; // ISO
  cancelAtPeriodEnd: boolean;
  entitlements: EntitlementWithLimits[];
  source: 'stripe' | 'local' | 'unknown' | string;
}

interface EntitlementWithLimits {
  label: EntitlementsList;
  value?: number | null;
}

type EntitlementsList =
  | 'custom_wheels'
  | 'save_sessions'
  | 'session_history'
  | 'branding'
  | 'client_links'
  | 'data_export'
  | 'email_results';
