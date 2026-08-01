import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';

import { PERSONAL_HOME_ROUTE, PROFESSIONAL_HOME_ROUTE } from '../../configs/routes.config';
import { selectAuthLoading, selectIsAuthenticated, selectPlan } from '../state/auth/auth.selectors';
import { planGuard } from './plan.guard';

describe('planGuard', () => {
  let store: MockStore;
  let router: Router;
  let mockUrlTree: UrlTree;

  function runGuard(required: PlanType | readonly PlanType[]): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() => planGuard(required)(null!, null!)) as Observable<boolean | UrlTree>;
  }

  beforeEach(() => {
    mockUrlTree = {} as UrlTree;

    TestBed.configureTestingModule({
      providers: [
        provideMockStore(),
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
  });

  describe('unauthenticated user', () => {
    it('redirects to "/" regardless of plan when user is not authenticated', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, false);
      store.overrideSelector(selectPlan, 'personal');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard('personal').subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(mockUrlTree);
    }));
  });

  describe('plan matches required', () => {
    it('allows navigation when authenticated user plan matches required plan', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectPlan, 'personal');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard('personal').subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));

    it('allows navigation when authenticated user plan is in the allowed plans', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectPlan, 'personal');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard(['free', 'personal']).subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));
  });

  describe('plan mismatch redirects', () => {
    it('redirects free-plan user to personal home when personal route is required', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectPlan, 'free');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard('personal').subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith([PERSONAL_HOME_ROUTE]);
      expect(result).toBe(mockUrlTree);
    }));

    it('redirects personal-plan user to personal home when professional route is required', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectPlan, 'personal');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard('professional').subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith([PERSONAL_HOME_ROUTE]);
      expect(result).toBe(mockUrlTree);
    }));

    it('redirects professional-plan user to professional home when free route is required', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectPlan, 'professional');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard('free').subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith([PROFESSIONAL_HOME_ROUTE]);
      expect(result).toBe(mockUrlTree);
    }));
  });

  describe('unknown plan', () => {
    it('redirects to "/" when authenticated user plan is undefined', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.overrideSelector(selectPlan, undefined);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      runGuard('personal').subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(mockUrlTree);
    }));
  });

  describe('loading gate', () => {
    it('waits for loading to become false before evaluating', fakeAsync(() => {
      // Arrange — loading starts as true
      store.overrideSelector(selectAuthLoading, true);
      store.overrideSelector(selectIsAuthenticated, false);
      store.overrideSelector(selectPlan, 'free');
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act — subscribe while still loading
      runGuard('free').subscribe((val) => (result = val));
      tick();

      // Guard should not have resolved yet
      expect(result).toBeUndefined();

      // Now clear loading
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      tick();

      // Assert — unauthenticated → redirect to root
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(mockUrlTree);
    }));
  });
});
