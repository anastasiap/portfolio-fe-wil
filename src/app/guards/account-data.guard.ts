import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, skip, switchMap, take } from 'rxjs/operators';

import { loadCurrentUser } from '../state/auth/auth.actions';
import { selectAuthLoading, selectIsAuthenticated, selectUser } from '../state/auth/auth.selectors';

export const accountDataGuard: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean => {
  if (route.queryParamMap?.get('signupId')?.trim()) return true;

  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([store.select(selectIsAuthenticated), store.select(selectUser), store.select(selectAuthLoading)]).pipe(
    filter(([, , loading]) => loading === false),
    take(1),
    switchMap(([isAuthenticated, user]) => {
      if (!isAuthenticated) return of(router.createUrlTree(['/']));
      if (user) return of(true);

      store.dispatch(loadCurrentUser());

      return combineLatest([store.select(selectIsAuthenticated), store.select(selectUser), store.select(selectAuthLoading)]).pipe(
        skip(1),
        filter(([, , loading]) => loading === false),
        take(1),
        map(([currentIsAuthenticated, currentUser]) => (currentIsAuthenticated && currentUser ? true : router.createUrlTree(['/'])))
      );
    })
  );
};
