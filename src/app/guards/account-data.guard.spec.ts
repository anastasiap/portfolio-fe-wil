import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';

import { User } from '../services/auth/auth.types';
import { loadCurrentUser } from '../state/auth/auth.actions';
import { selectAuthLoading, selectIsAuthenticated, selectUser } from '../state/auth/auth.selectors';
import { accountDataGuard } from './account-data.guard';

describe('accountDataGuard', () => {
  let store: MockStore;
  let router: Router;
  let mockUrlTree: UrlTree;
  let mockRoute: ActivatedRouteSnapshot;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    systemRole: 'user',
    status: 'active',
    auth: {
      mfaEnabled: false,
      lastLoginAt: new Date().toISOString(),
    },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    mockUrlTree = {} as UrlTree;
    mockRoute = {
      queryParamMap: convertToParamMap({}),
    } as ActivatedRouteSnapshot;

    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsAuthenticated, value: true },
            { selector: selectUser, value: null },
            { selector: selectAuthLoading, value: false },
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
  });

  it('returns true synchronously when signupId query param is present', () => {
    mockRoute = {
      queryParamMap: convertToParamMap({ signupId: 'signup-123' }),
    } as ActivatedRouteSnapshot;
    const dispatchSpy = spyOn(store, 'dispatch');

    const result = TestBed.runInInjectionContext(() => accountDataGuard(mockRoute, {} as never));

    expect(result).toBe(true);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not bypass account data checks when signupId query param is blank', fakeAsync(() => {
    mockRoute = {
      queryParamMap: convertToParamMap({ signupId: '   ' }),
    } as ActivatedRouteSnapshot;
    store.overrideSelector(selectIsAuthenticated, false);
    store.overrideSelector(selectAuthLoading, false);
    store.refreshState();
    const dispatchSpy = spyOn(store, 'dispatch');
    let result: boolean | UrlTree | undefined;

    const guard$ = TestBed.runInInjectionContext(() => accountDataGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
    guard$.subscribe((value) => (result = value));
    tick();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(mockUrlTree);
    expect(dispatchSpy).not.toHaveBeenCalled();
  }));

  it('allows navigation without dispatching when user data is already available', fakeAsync(() => {
    store.overrideSelector(selectUser, mockUser);
    store.refreshState();
    const dispatchSpy = spyOn(store, 'dispatch');
    let result: boolean | UrlTree | undefined;

    const guard$ = TestBed.runInInjectionContext(() => accountDataGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
    guard$.subscribe((value) => (result = value));
    tick();

    expect(result).toBe(true);
    expect(dispatchSpy).not.toHaveBeenCalled();
  }));

  it('dispatches loadCurrentUser and waits for user data when authenticated data is missing', fakeAsync(() => {
    const dispatchSpy = spyOn(store, 'dispatch');
    let result: boolean | UrlTree | undefined;

    const guard$ = TestBed.runInInjectionContext(() => accountDataGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
    guard$.subscribe((value) => (result = value));
    tick();

    expect(dispatchSpy).toHaveBeenCalledWith(loadCurrentUser());
    expect(result).toBeUndefined();

    store.overrideSelector(selectUser, mockUser);
    store.overrideSelector(selectAuthLoading, false);
    store.refreshState();
    tick();

    expect(result).toBe(true);
  }));

  it('redirects to home when auth is lost before account data is available', fakeAsync(() => {
    const dispatchSpy = spyOn(store, 'dispatch');
    let result: boolean | UrlTree | undefined;

    const guard$ = TestBed.runInInjectionContext(() => accountDataGuard(mockRoute, {} as never)) as Observable<boolean | UrlTree>;
    guard$.subscribe((value) => (result = value));
    tick();

    expect(dispatchSpy).toHaveBeenCalledWith(loadCurrentUser());

    store.overrideSelector(selectIsAuthenticated, false);
    store.overrideSelector(selectAuthLoading, false);
    store.refreshState();
    tick();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(mockUrlTree);
  }));
});
