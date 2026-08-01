import { ChangeDetectionStrategy, Component, inject, OnInit, signal, Type } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthModalData, AuthModalView } from './auth-modal.types';
import { LoginModalContentComponent } from './login-modal-content/login-modal-content.component';
import { PlanSelectModalContentComponent } from './plan-select-modal-content/plan-select-modal-content.component';
import { ForgotPasswordModalContentComponent } from './forgot-password-modal-content/forgot-password-modal-content.component';
import { BASE } from '../../../configs/routes.config';
import * as AuthActions from '../../state/auth/auth.actions';
import { clearAuthError } from '../../state/auth/auth.actions';
import { Store } from '@ngrx/store';
import { AnalyticsService } from '../../services/analytics/analytics.service';
import { WaitlistModalComponent } from '../../ui/modals/waitlist-modal/waitlist-modal.component';
import { Router } from '@angular/router';

type AuthModalContentComponent = LoginModalContentComponent | PlanSelectModalContentComponent | ForgotPasswordModalContentComponent;

/**
 * Reusable authentication modal shell component.
 * This component acts as a container for dynamic authentication content (login, register, forgot password).
 * It provides the dialog structure, close button, and content switching mechanism.
 */
@Component({
  selector: 'wil-auth-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LoginModalContentComponent,
    PlanSelectModalContentComponent,
    ForgotPasswordModalContentComponent
],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthModalComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialogRef = inject(MatDialogRef<AuthModalComponent>);
  private readonly dialogData = inject(MAT_DIALOG_DATA) as AuthModalData;
  private readonly dialog = inject(MatDialog);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  public readonly currentView = signal<AuthModalView>(this.dialogData.initialView);
  public readonly viewTitle = signal<string>(this.getTitleForView(this.currentView()));
  public readonly contentComponent = signal<Type<AuthModalContentComponent>>(this.getComponentForView(this.currentView()));

  ngOnInit() {
    this.store.dispatch(clearAuthError());
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Handle plan selection from plan select component
   * Opens the payment method modal with appropriate data
   */
  public onPlanSelected(plan: PlanType): void {
    const successUrl = this.buildAbsoluteUrl(`/${BASE}/account`);
    const cancelUrl = this.buildAbsoluteUrl('/plans');

    if (plan === 'free') {
      // Track plan selection
      this.analytics.track('plan_selected', {
        plan: plan.toLowerCase() as 'free',
        source: 'choose_plan_modal',
      });

      this.onClose();
      this.router.navigate(['/register-free-account']);
    }

    if (plan === 'personal') {
      // Track plan selection
      this.analytics.track('plan_selected', {
        plan: plan.toLowerCase() as 'personal',
        source: 'choose_plan_modal',
      });

      this.store.dispatch(
        AuthActions.createCheckoutSession({
          request: {
            plan: 'personal',
            successUrl,
            cancelUrl,
          },
        })
      );
    }

    if (plan === 'professional') {
      this.onClose();

      this.analytics.track('professional_interest_viewed', {
        plan: plan.toLowerCase() as 'professional',
        source: 'choose_plan_modal',
      });

      const dialogData: AnalyticsDialogData = {
        planType: 'Professional',
        source: 'auth_modal',
      };

      this.dialog.open(WaitlistModalComponent, {
        data: dialogData,
        maxWidth: '95vw',
        disableClose: false,
        autoFocus: true,
        panelClass: 'modal-panel',
      });
    }
  }

  /**
   * Switch to a different view (login, register, forgot-password)
   * This method can be called by child content components to switch views
   */
  public switchView(view: AuthModalView): void {
    // Track choose_plan_viewed when modal opens for plan selection
    if (view === 'register') {
      this.analytics.track('signup_entry_clicked', {
        source: 'login_modal',
      });
    }

    this.currentView.set(view);
    this.viewTitle.set(this.getTitleForView(view));
    this.contentComponent.set(this.getComponentForView(view));
  }

  private getTitleForView(view: AuthModalView): string {
    const titles: Record<AuthModalView, string> = {
      login: 'Welcome Back',
      register: this.dialogData.feature === 'lock' ? 'This feature is a part of Personal Plans' : 'Choose your plan',
      forgotPassword: 'Reset Password',
    };
    return titles[view];
  }

  private getComponentForView(view: AuthModalView): Type<AuthModalContentComponent> {
    const components: Record<AuthModalView, Type<AuthModalContentComponent>> = {
      login: LoginModalContentComponent,
      register: PlanSelectModalContentComponent,
      forgotPassword: ForgotPasswordModalContentComponent,
    };

    return components[view];
  }

  private buildAbsoluteUrl(path: string): string {
    const origin = this.document.defaultView?.location.origin;
    return origin ? `${origin}${path}` : path;
  }
}
