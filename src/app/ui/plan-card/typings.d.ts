interface PlanCardData {
  readonly headerText: string;
  readonly price: string;
  readonly priceSubtext?: string;
  readonly features: readonly string[];
  readonly ctaButtonText: string;
  readonly isHighlighted?: boolean;
  readonly planType: 'Free' | 'Personal' | 'Professional';
  readonly benefits?: string;
}
