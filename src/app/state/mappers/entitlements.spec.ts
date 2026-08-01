import { mapEntitlements } from './entitlements';

describe('mapEntitlements', () => {
  it('should map entitlement labels with numeric limits', () => {
    const result = mapEntitlements([
      { label: 'custom_wheels', value: 3 },
      { label: 'save_sessions', value: 25 },
      { label: 'client_links', value: 10 },
    ]);

    expect(result).toEqual(['Customs Wheels: 3', 'Sessions: 25', 'Clients: 10']);
  });

  it('should map null, undefined, and zero limits as unlimited', () => {
    const result = mapEntitlements([
      { label: 'branding', value: null },
      { label: 'data_export' },
      { label: 'email_results', value: 0 },
    ]);

    expect(result).toEqual(['Branding: Unlimited', 'Sessions Data Export: Unlimited', 'E-mail Results: Unlimited']);
  });

  it('should preserve the input order and map every known entitlement label', () => {
    const result = mapEntitlements([
      { label: 'session_history', value: 1 },
      { label: 'branding', value: 1 },
      { label: 'custom_wheels', value: 1 },
      { label: 'email_results', value: 1 },
      { label: 'data_export', value: 1 },
      { label: 'client_links', value: 1 },
      { label: 'save_sessions', value: 1 },
    ]);

    expect(result).toEqual([
      'Sessions Analytics: 1',
      'Branding: 1',
      'Customs Wheels: 1',
      'E-mail Results: 1',
      'Sessions Data Export: 1',
      'Clients: 1',
      'Sessions: 1',
    ]);
  });

  it('should return an empty array when there are no entitlements', () => {
    expect(mapEntitlements([])).toEqual([]);
  });
});
