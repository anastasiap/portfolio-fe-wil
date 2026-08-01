import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { switchMap, withLatestFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { selectAuthLoading, selectIsAuthenticated, selectSubscriptionStatus } from '../state/auth/auth.selectors';
import { BASE } from '../../configs/routes.config';

/**
 * Guard that prevents access for users with problematic subscription statuses.
 * Blocks access for:
 * - 'cancelled' / 'canceled' status
 * - 'payment_issue' status
 *
 * Redirects to subscription page where relevant error messages are displayed.
 */
export const subscriptionGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthLoading).pipe(
    filter((loading) => loading === false),
    switchMap(() => store.select(selectIsAuthenticated)),
    withLatestFrom(store.select(selectSubscriptionStatus)),
    take(1),
    map(([isAuthed, subscriptionStatus]) => {
      // If not authenticated, let authGuard handle it
      if (!isAuthed) return true;

      // Block access for problematic subscription statuses
      const problematicStatuses = ['cancelled', 'canceled', 'payment_issue'];

      if (subscriptionStatus && problematicStatuses.includes(subscriptionStatus)) {
        // Redirect to subscription page where error message is shown
        return router.createUrlTree([`${BASE}/account/subscription`]);
      }

      // Allow access for all other statuses (active, trialing, etc.)
      return true;
    })
  );
};
