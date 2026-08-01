import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';

import { BASE } from '../../configs/routes.config';
import { selectAuthLoading, selectIsAuthenticated, selectSubscriptionStatus } from '../state/auth/auth.selectors';
import { subscriptionGuard } from './subscription.guard';

describe('subscriptionGuard', () => {
  let store: MockStore;
  let router: Router;
  let mockUrlTree: UrlTree;

  function runGuard(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() => subscriptionGuard(null!, null!)) as Observable<boolean | UrlTree>;
  }

  beforeEach(() => {
    mockUrlTree = {} as UrlTree;

    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAuthLoading, value: false },
            { selector: selectIsAuthenticated, value: true },
            { selector: selectSubscriptionStatus, value: 'active' },
          ],
        }),
        {
          provide: Router,
          useValue: {
            createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(mockUrlTree),
          },
        },
      ],
    });

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    store?.resetSelectors();
    (router.createUrlTree as jasmine.Spy).calls.reset();
  });

  describe('unauthenticated user', () => {
    it('passes through (returns true) even when subscription status is problematic, deferring to authGuard', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, false);
      store.overrideSelector(selectSubscriptionStatus, 'cancelled');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
    }));
  });

  describe('allowed subscription statuses', () => {
    it('allows navigation when subscription status is "active"', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, 'active');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));

    it('allows navigation when subscription status is "trialing"', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, 'trialing');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));

    it('allows navigation when subscription status is null (no subscription)', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, null as never);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));

    it('allows navigation when subscription status is undefined', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, undefined);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));
  });

  describe('blocked subscription statuses', () => {
    it('redirects to subscription page when status is "cancelled"', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, 'cancelled');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith([`${BASE}/account/subscription`]);
      expect(result).toBe(mockUrlTree);
    }));

    it('redirects to subscription page when status is "canceled" (US spelling)', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, 'canceled');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith([`${BASE}/account/subscription`]);
      expect(result).toBe(mockUrlTree);
    }));

    it('redirects to subscription page when status is "payment_issue"', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, 'payment_issue');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard().subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith([`${BASE}/account/subscription`]);
      expect(result).toBe(mockUrlTree);
    }));
  });

  describe('loading gate', () => {
    it('waits for loading to become false before evaluating subscription status', fakeAsync(() => {
      // Arrange — loading starts as true
      store.overrideSelector(selectAuthLoading, true);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectSubscriptionStatus, 'cancelled');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act — subscribe while still loading
      runGuard().subscribe((val) => (result = val));
      tick();

      // Guard should not have resolved yet
      expect(result).toBeUndefined();

      // Now clear loading
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      tick();

      // Assert — problematic status → redirect
      expect(router.createUrlTree).toHaveBeenCalledWith([`${BASE}/account/subscription`]);
      expect(result).toBe(mockUrlTree);
    }));
  });
});
