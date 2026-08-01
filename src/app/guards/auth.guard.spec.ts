import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';

import { selectAuthLoading, selectIsAuthenticated } from '../state/auth/auth.selectors';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let store: MockStore;
  let router: Router;
  let mockUrlTree: UrlTree;
  let mockRoute: ActivatedRouteSnapshot;

  beforeEach(() => {
    mockUrlTree = {} as UrlTree;

    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAuthLoading, value: false },
            { selector: selectIsAuthenticated, value: false },
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

    mockRoute = {
      queryParamMap: {
        has: jasmine.createSpy('has').and.returnValue(false),
        get: jasmine.createSpy('get').and.returnValue(null),
      },
    } as never;
  });

  afterEach(() => {
    store?.resetSelectors();
  });

  describe('signup completion bypass', () => {
    it('returns true synchronously when signupId query param is present', () => {
      // Arrange
      (mockRoute.queryParamMap.get as jasmine.Spy).and.returnValue('signup-123');

      // Act
      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, {} as never));

      // Assert
      expect(result).toBe(true);
      expect(mockRoute.queryParamMap.get).toHaveBeenCalledWith('signupId');
    });

    it('falls through to store check when signupId query param is blank', fakeAsync(() => {
      // Arrange
      (mockRoute.queryParamMap.get as jasmine.Spy).and.returnValue('   ');
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, false);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      const guard$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
      guard$.subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(mockUrlTree);
    }));

    it('falls through to store check when queryParamMap is null', fakeAsync(() => {
      // Arrange
      (mockRoute as unknown as { queryParamMap: null }).queryParamMap = null;
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      const guard$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
      guard$.subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));
  });

  describe('authenticated user', () => {
    it('allows navigation when auth is not loading and user is authenticated', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, true);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      const guard$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
      guard$.subscribe((val) => (result = val));
      tick();

      // Assert
      expect(result).toBe(true);
    }));
  });

  describe('unauthenticated user', () => {
    it('redirects to "/" when auth is not loading and user is not authenticated', fakeAsync(() => {
      // Arrange
      store.overrideSelector(selectAuthLoading, false);
      store.overrideSelector(selectIsAuthenticated, false);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act
      const guard$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
      guard$.subscribe((val) => (result = val));
      tick();

      // Assert
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(mockUrlTree);
    }));
  });

  describe('loading state', () => {
    it('waits for loading to become false before evaluating authentication', fakeAsync(() => {
      // Arrange — start with loading=true, user unauthenticated
      store.overrideSelector(selectAuthLoading, true);
      store.overrideSelector(selectIsAuthenticated, false);
      store.refreshState();
      let result: boolean | UrlTree | undefined;

      // Act — subscribe but loading hasn't cleared yet
      const guard$ = TestBed.runInInjectionContext(() => authGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
      guard$.subscribe((val) => (result = val));
      tick();

      // Guard should not have resolved while loading
      expect(result).toBeUndefined();

      // Now clear loading state
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      tick();

      // Assert — unauthenticated user gets redirected
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toBe(mockUrlTree);
    }));
  });
});
