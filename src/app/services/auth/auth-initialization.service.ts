// src/app/services/auth/auth-initialization.service.ts
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, race, timer } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import * as AuthActions from '../../state/auth/auth.actions';
import { selectAuthLoading } from '../../state/auth/auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthInitializationService {
  private readonly store = inject(Store);

  /**
   * Keep this short-ish. If auth is slow or broken, we prefer to boot the app
   * (user can retry / refresh) rather than hang forever.
   */
  private readonly INIT_TIMEOUT_MS = 8000;

  async initializeAuth(): Promise<void> {
    // 1) kick off auth init
    this.store.dispatch(AuthActions.initializeAuth());

    // 2) wait until auth loading becomes false
    const authSettled$ = this.store.select(selectAuthLoading).pipe(
      filter((loading) => !loading),
      take(1),
      map(() => void 0)
    );

    // 3) safety valve: timeout (do NOT throw, just proceed)
    const timeout$ = timer(this.INIT_TIMEOUT_MS).pipe(map(() => void 0));

    await firstValueFrom(race(authSettled$, timeout$));
  }
}
