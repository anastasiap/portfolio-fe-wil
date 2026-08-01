import { environment } from 'src/environments/environment';

/**
 * Configuration for legal documents (Terms of Service and Privacy Policy)
 * Provides centralized configuration for legal doc paths, versions, and metadata
 */
export const LEGAL_DOCS = {
  terms: {
    title: 'Terms of Service',
    pageTitle: 'Terms of Service',
    lastUpdated: environment.legal.termsVersion,
    assetPath: 'assets/legal/terms-of-service.md',
  },
  privacy: {
    title: 'Privacy Policy',
    pageTitle: 'Privacy Policy',
    lastUpdated: environment.legal.privacyVersion,
    assetPath: 'assets/legal/privacy-policy.md',
  },
  cookies: {
    title: 'Cookies',
    pageTitle: 'Cookies',
    lastUpdated: environment.legal.cookies,
    assetPath: 'assets/legal/cookies.md',
  },
};
