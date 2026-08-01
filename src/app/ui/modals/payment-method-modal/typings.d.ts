interface PaymentMethodDialogData {
  planName: PlanType;
  planDisplayName: string;
  price: string;
  subtext: string;
}

type LoadingState = 'stripe' | 'paypal' | null;
