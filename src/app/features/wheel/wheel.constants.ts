import { DEFAULT_WHEEL_IDS_BY_LOCALE, DEFAULT_WHEEL_LOCALE } from '../../../configs/i18n.config';

export const COLUMNS_NUMBER = 2;

export const MARK_SYSTEM = 10;

export enum COLORS {
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#f9ca24',
  '#6c5ce7',
  '#e17055',
  '#00b894',
  '#a29bfe',
  '#ff6b74',
  '#ff6ba3',
  '#b06bff',
  '#6b9aff',
  '#6bcaff',
  '#6bffcd',
  '#6bff6e',
  '#b3ff6b',
  '#feff6b',
  '#ffa76b',
}

export enum Label {
  'Health & Wellbeing',
  'Relationships',
  'Career & Purpose',
  'Finances & Security',
  'Personal Growth',
  'Leisure & Rest',
  'Social Contribution',
  'Spirituality',
}

export enum Description {
  'How well do you care for your body and energy?',
  'Do you feel connected and supported?',
  'Does your work give you a sense of direction or pride?',
  'How safe and stable do you feel around money?',
  'Are you evolving, learning, becoming wiser?',
  'Do you allow yourself to pause, play, and breathe?',
  'Do you feel that what you do adds something good to the world?',
  'How connected do you feel to something larger than yourself?',
}

export const defaultWheelIdByLocale = (locale: Locale): string => DEFAULT_WHEEL_IDS_BY_LOCALE[locale ?? DEFAULT_WHEEL_LOCALE];

export const DONT_WARN_COOKIE = 'wheeloflife-save-confirmation-disabled';

export const PLANS_DATA: PlanCardData[] = [
  {
    headerText: 'Basic',
    price: 'Free',
    priceSubtext: 'Forever',
    planType: 'Free',
    features: ['Create 5 Wheels for free', 'Set Focus Categories', 'Add Reflection Notes', 'View In-Depth Analytics'],
    ctaButtonText: 'Try it',
    benefits: 'Whole life at a glance, instant clarity — without paying a cent',
    isHighlighted: true,
  },
  {
    headerText: 'Personal',
    price: '$5',
    priceSubtext: 'per month',
    planType: 'Personal',
    features: ['Create Unlimited Wheels*', 'Set Focus Categories', 'Add Reflection Notes', 'View In-Depth Analytics'],
    ctaButtonText: 'Get started',
    benefits: 'Track trends with your wheels saved and compared',
    isHighlighted: false,
  },
  {
    headerText: 'Professional',
    price: '$37',
    priceSubtext: 'per month',
    planType: 'Professional',
    features: ['Create Unique Environment for Each Client', 'View In-Depth Session Analytics', 'Set Branded page'],
    benefits: 'Look professional, deliver quick insights, and keep clients coming back',
    ctaButtonText: "I'm interested",
    isHighlighted: false,
  },
];
