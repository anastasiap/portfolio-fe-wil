import { Component, inject, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PendingSignupData, SignupCompletionState } from '../../../../../../services/auth/auth.types';
import { CompleteSignupFormComponent } from '../../features/complete-signup-form/complete-signup-form.component';
import { Router } from '@angular/router';
import { BASE } from '../../../../../../../configs/routes.config';

@Component({
  selector: 'wil-complete-signup',
  standalone: true,
  imports: [CompleteSignupFormComponent, NgTemplateOutlet],
  templateUrl: './complete-signup.component.html',
  styleUrl: './complete-signup.component.scss',
})
export class CompleteSignupComponent {
  private readonly router = inject(Router);

  public readonly signupCompletionState = input.required<SignupCompletionState>();
  public readonly signupData = input.required<PendingSignupData | null>();
  public readonly signupError = input.required<string | null>();
  public readonly isPollingTimeout = input.required<boolean>();

  public readonly retryCheck = output<void>();

  public onRetryCheck(): void {
    this.retryCheck.emit();
  }

  public navigateToSupport(): void {
    this.router.navigate([`/${BASE}/account/support`]);
  }
}
