import { ChangeDetectionStrategy, Component, computed, inject, OnInit, Signal } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  selectAuthLoading,
  selectPendingSignupData,
  selectPendingSignupError,
  selectPendingSignupPollingTimeout,
  selectPendingSignupState,
  selectUser,
} from 'src/app/state/auth/auth.selectors';
import { loadPendingSignup, resendVerificationEmail } from '../../../../state/auth/auth.actions';
import { CompleteSignupComponent } from './ui/complete-signup/complete-signup.component';
import { EmailPreferencesFormComponent } from './features/email-preferences-form/email-preferences-form.component';
import { MatIcon } from '@angular/material/icon';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';

@Component({
  selector: 'wil-account-profile',
  standalone: true,
  imports: [CompleteSignupComponent, EmailPreferencesFormComponent, MatIcon, CtaButtonComponent],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  public readonly isLoading = toSignal(this.store.select(selectAuthLoading), { initialValue: false });
  public readonly currentUser = toSignal(this.store.select(selectUser), { initialValue: null });
  public readonly signupId: Signal<string | null> = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('signupId')?.trim() || null)),
    { initialValue: null }
  );
  public readonly signupCompletionState = toSignal(this.store.select(selectPendingSignupState), { initialValue: 'loading' });
  public readonly signupData = toSignal(this.store.select(selectPendingSignupData), { initialValue: null });
  public readonly signupError = toSignal(this.store.select(selectPendingSignupError), { initialValue: null });
  public readonly isPollingTimeout = toSignal(this.store.select(selectPendingSignupPollingTimeout), { initialValue: false });

  public readonly isSignupCompletionMode = computed(() => !!this.signupId());

  ngOnInit(): void {
    const id = this.signupId();
    if (id) {
      this.store.dispatch(loadPendingSignup({ signupId: id }));
    }
  }

  public onRetryCheck(): void {
    const id = this.signupId();
    if (id) {
      this.store.dispatch(loadPendingSignup({ signupId: id }));
    }
  }

  public resendVerificationEmail(): void {
    this.store.dispatch(resendVerificationEmail());
  }
}
