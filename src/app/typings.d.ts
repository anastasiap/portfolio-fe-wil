interface PayPalDonationButtonConfig {
  env: 'sandbox' | 'production';
  hosted_button_id: string;
  image: {
    alt: string;
    src: string;
    title: string;
  };
}

interface PayPalDonationButton {
  render(element: string | HTMLElement): void;
}

interface PayPalDonation {
  Button(config: PayPalDonationButtonConfig): PayPalDonationButton;
}

interface PayPalSDK {
  Donation: PayPalDonation;
}

interface Window {
  PayPal: PayPalSDK;
}

type Locale = 'ru' | 'en';

type PlanType = 'free' | 'personal' | 'professional';

interface AnalyticsDialogData {
  readonly planType: 'Personal' | 'Professional';
  readonly source: 'auth_modal' | 'plans_page';
}
