import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { selectAuthLoading, selectIsAuthenticated, selectPlan } from '../state/auth/auth.selectors';
import { PERSONAL_HOME_ROUTE, PROFESSIONAL_HOME_ROUTE } from '../../configs/routes.config';

export const rootRedirectGuard: CanMatchFn = (): Observable<boolean | UrlTree> => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([store.select(selectAuthLoading), store.select(selectIsAuthenticated), store.select(selectPlan)]).pipe(
    filter(([loading]) => loading === false),
    take(1),
    map(([, isAuthed, plan]) => {
      // ✅ logged out -> allow showing Home at /
      if (!isAuthed) return true;

      // ✅ logged in -> redirect by plan
      if (plan === 'personal') return router.createUrlTree([PERSONAL_HOME_ROUTE]);
      if (plan === 'professional') return router.createUrlTree([PROFESSIONAL_HOME_ROUTE]);

      // fallback if plan missing (shouldn't really happen if user is authed)
      return router.createUrlTree([PERSONAL_HOME_ROUTE]);
    })
  );
};
