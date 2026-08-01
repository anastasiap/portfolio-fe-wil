export const entitlementsMap: Record<EntitlementsList, string> = {
  custom_wheels: 'Customs Wheels: ',
  save_sessions: 'Sessions: ',
  data_export: 'Sessions Data Export: ',
  session_history: 'Sessions Analytics: ',
  branding: 'Branding: ',
  client_links: 'Clients: ',
  email_results: 'E-mail Results: ',
};

export const mapEntitlements = (features: EntitlementWithLimits[]): string[] => {
  return features.map((f) => (f.value ? `${entitlementsMap[f.label]}${f.value}` : `${entitlementsMap[f.label]}Unlimited`));
};
