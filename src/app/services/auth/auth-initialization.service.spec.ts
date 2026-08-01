import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AuthInitializationService } from './auth-initialization.service';
import * as AuthActions from '../../state/auth/auth.actions';
import { initialAuthState } from '../../state/auth/auth.reducer';

describe('AuthInitializationService', () => {
  let service: AuthInitializationService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthInitializationService,
        provideMockStore({
          initialState: {
            auth: initialAuthState,
          },
        }),
      ],
    });

    service = TestBed.inject(AuthInitializationService);
    store = TestBed.inject(MockStore);

    spyOn(store, 'dispatch');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeAuth', () => {
    it('should dispatch initializeAuth action', async () => {
      // Act
      await service.initializeAuth();

      // Assert
      expect(store.dispatch).toHaveBeenCalledWith(AuthActions.initializeAuth());
    });

    it('should resolve immediately without blocking', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await service.initializeAuth();
      const endTime = Date.now();

      // Assert - Should resolve in less than 10ms (essentially immediate)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10);
    });

    it('should dispatch action only once per call', async () => {
      // Act
      await service.initializeAuth();

      // Assert
      expect(store.dispatch).toHaveBeenCalledTimes(1);
    });

    it('should return a Promise that resolves to void', async () => {
      // Act
      const result = await service.initializeAuth();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle multiple consecutive calls', async () => {
      // Act
      await service.initializeAuth();
      await service.initializeAuth();
      await service.initializeAuth();

      // Assert
      expect(store.dispatch).toHaveBeenCalledTimes(3);
      expect(store.dispatch).toHaveBeenCalledWith(AuthActions.initializeAuth());
    });
  });
});
