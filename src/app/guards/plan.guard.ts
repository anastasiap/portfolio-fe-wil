import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { switchMap, withLatestFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { selectAuthLoading, selectIsAuthenticated, selectPlan } from '../state/auth/auth.selectors';
import { PERSONAL_HOME_ROUTE, PROFESSIONAL_HOME_ROUTE } from '../../configs/routes.config';

export const planGuard = (required: PlanType | readonly PlanType[]): CanActivateFn => {
  return () => {
    const store = inject(Store);
    const router = inject(Router);
    const allowedPlans: readonly PlanType[] = Array.isArray(required) ? required : [required];

    return store.select(selectAuthLoading).pipe(
      filter((loading) => loading === false),
      switchMap(() => store.select(selectIsAuthenticated)),
      withLatestFrom(store.select(selectPlan)),
      take(1),
      map(([isAuthed, plan]) => {
        if (!isAuthed) return router.createUrlTree(['/']);

        if (plan && allowedPlans.includes(plan)) return true;

        if (plan === 'free') return router.createUrlTree([PERSONAL_HOME_ROUTE]);
        if (plan === 'personal') return router.createUrlTree([PERSONAL_HOME_ROUTE]);
        if (plan === 'professional') return router.createUrlTree([PROFESSIONAL_HOME_ROUTE]);

        // If plan unknown, choose safe default
        return router.createUrlTree(['/']);
      })
    );
  };
};
