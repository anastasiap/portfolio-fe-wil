import { authGuard } from '../app/guards/auth.guard';
import { planGuard } from '../app/guards/plan.guard';
import { subscriptionGuard } from '../app/guards/subscription.guard';

export interface RouteData {
  title?: string;
  description?: string;
  hideHeader?: boolean;
  hideFooter?: boolean;
  clientMode?: boolean;
}

export const BASE = 'app';
export const PERSONAL_HOME_ROUTE = `${BASE}/wheel`;
export const PROFESSIONAL_HOME_ROUTE = `${BASE}/workplace`;

export const freeGuards = [authGuard, planGuard('free'), subscriptionGuard];
export const personalHomeGuards = [authGuard, planGuard(['free', 'personal']), subscriptionGuard];
export const personalGuards = [authGuard, planGuard('personal'), subscriptionGuard];
export const professionalGuards = [authGuard, planGuard('professional')];

export const routesDataMapping: Record<string, RouteData> = {
  HomeComponent: {
    title: 'Free Customizable Online Tool',
    description: 'A free interactive customizable Wheel of Life generator, online tool for coaches and self-reflection. No login required.',
  },
  AboutMeComponent: {
    title: 'About Me',
    description:
      'Learn about the creator of this free Wheel of Life tool and the story behind helping coaches and individuals with self-reflection.',
  },
  RegisterFreeAccountComponent: {
    title: 'Register Free Account',
    description: 'A free interactive customizable Wheel of Life generator, online tool for self-reflection. Free account.',
  },
  LandingCoachesComponent: {
    title: 'Wheel for Your Website',
    description:
      'Professional coaching tools and resources. Discover how the Wheel of Life can enhance your coaching practice and client outcomes.',
  },
  LandingPaidPlansComponent: {
    title: 'Plans & Pricing',
    description:
      'Explore our premium plans and features for professional coaches. Enhanced tools for client management and advanced assessments.',
  },
  LandingWaitlistComponent: {
    title: 'Personal Plan Premium Offer',
    description: 'Explore our premium plans and features for personal plan.',
  },
  BlogComponent: {
    title: 'Blog',
    description:
      'Insights, tips, and guides about personal development, coaching techniques, and making the most of the Wheel of Life tool.',
  },

  PersonalComponent: {
    title: 'Personal Plan',
    description: 'Manage your personal wheels and assessments with the Personal Plan features.',
  },
  WheelSessionsComponent: {
    title: 'Wheel Sessions',
    description: 'Wheels Session Analytics.',
  },

  ProfessionalComponent: {
    title: 'Professional plan',
    description: 'Manage your wheels and clients sessions.',
  },

  UserAccountComponent: {
    title: 'Account Settings',
    description: 'Manage your account settings, profile, subscription, and preferences.',
  },
  AccountProfileComponent: {
    title: 'Profile',
    description: 'Manage your personal information and account preferences.',
  },
  SubscriptionBillingComponent: {
    title: 'Subscription & Billing',
    description: 'View and manage your subscription plan and billing information.',
  },
  GdprPrivacyComponent: {
    title: 'GDPR & Privacy Controls',
    description: 'Control your privacy settings and manage your data.',
  },
  SecurityComponent: {
    title: 'Security',
    description: 'Manage your account security settings and authentication.',
  },
  ContactSupportComponent: {
    title: 'Contact & Support',
    description: 'Get help and contact our support team.',
  },
  HowTosComponent: {
    title: 'How-tos',
    description: 'Learn how to use the platform with guides and tutorials.',
  },

  ClientViewComponent: { clientMode: true, hideHeader: true, hideFooter: true },

  ClientLinkNotFoundComponent: {
    hideHeader: true,
    hideFooter: true,
    title: 'Client Link Not Found',
    description: 'The client link you are looking for could not be found. Please check the URL or contact your coach.',
  },
  VerifyEmailComponent: {
    title: 'Email Verification',
    description: 'Verify your email address to activate your account and access all features.',
  },
  NotFoundComponent: {
    title: 'Page Not Found',
    description: 'The page you are looking for could not be found. Return to the Wheel of Life tool or browse our other resources.',
  },
};
