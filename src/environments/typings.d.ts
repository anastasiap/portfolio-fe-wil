interface BrandEnvironment {
  production: boolean;
  legal: LegalVersions;
  apiUrl: string;
  // sentry: {
  //   SENTRY_AUTH_TOKEN: string;
  //   sentryEnabled: boolean;
  //   sentryDsn: string;
  //   release: string;
  //   environmentName: 'production' | 'testing' | 'development';
  // };
}

interface LegalVersions {
  termsVersion: string;
  privacyVersion: string;
  cookies: string;
}
