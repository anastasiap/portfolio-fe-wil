import { selectAccountEmailPreferences, selectIsSubscriptionNavigationRestricted } from './auth.selectors';
import { Account } from '../../services/auth/auth.types';

describe('Auth Selectors', () => {
  describe('selectIsSubscriptionNavigationRestricted', () => {
    it('should return true for authenticated users with restricted subscription statuses', () => {
      expect(selectIsSubscriptionNavigationRestricted.projector(false, true, 'cancelled')).toBeTrue();
      expect(selectIsSubscriptionNavigationRestricted.projector(false, true, 'canceled')).toBeTrue();
      expect(selectIsSubscriptionNavigationRestricted.projector(false, true, 'payment_issue')).toBeTrue();
    });

    it('should return false while auth is loading', () => {
      expect(selectIsSubscriptionNavigationRestricted.projector(true, true, 'cancelled')).toBeFalse();
    });

    it('should return false for unauthenticated users', () => {
      expect(selectIsSubscriptionNavigationRestricted.projector(false, false, 'cancelled')).toBeFalse();
    });

    it('should return false for unrestricted or missing subscription statuses', () => {
      expect(selectIsSubscriptionNavigationRestricted.projector(false, true, 'active')).toBeFalse();
      expect(selectIsSubscriptionNavigationRestricted.projector(false, true, undefined)).toBeFalse();
    });
  });

  describe('selectAccountEmailPreferences', () => {
    it('should normalize undefined preferences to default false values', () => {
      // Arrange
      const mockAccount: Account = {
        id: 'account-123',
        name: 'Test Account',
        type: 'premium',
        // preferences is undefined
      };

      // Act
      const result = selectAccountEmailPreferences.projector(mockAccount);

      // Assert
      expect(result).toEqual({
        marketingContent: false,
      });
    });

    it('should return actual preferences when they exist', () => {
      // Arrange
      const mockAccount: Account = {
        id: 'account-123',
        name: 'Test Account',
        type: 'premium',
        preferences: {
          email: {
            productUpdates: true,
            educationalContent: false,
            marketingContent: true,
            updatedAt: '2024-01-01T12:00:00Z',
          },
        },
      };

      // Act
      const result = selectAccountEmailPreferences.projector(mockAccount);

      // Assert
      expect(result).toEqual({
        productUpdates: true,
        educationalContent: false,
        marketingContent: true,
        updatedAt: '2024-01-01T12:00:00Z',
      });
    });

    it('should handle null account', () => {
      // Act
      const result = selectAccountEmailPreferences.projector(null);

      // Assert
      expect(result).toEqual({
        marketingContent: false,
      });
    });
  });
});
