import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, switchMap } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { selectAuthLoading, selectIsAuthenticated } from '../state/auth/auth.selectors';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean => {
  const store = inject(Store);
  const router = inject(Router);

  // Signup completion mode bypass
  if (route.queryParamMap?.get('signupId')?.trim()) return true;

  return store.select(selectAuthLoading).pipe(
    filter((loading) => loading === false),
    take(1),
    switchMap(() => store.select(selectIsAuthenticated)),
    map((isAuthed) => (isAuthed ? true : router.createUrlTree(['/'])))
  );
};
