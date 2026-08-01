import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CompleteSignupFormComponent } from '../user-profile/features/account-profile/features/complete-signup-form/complete-signup-form.component';
import { FreePlanBenefitsComponent } from './ui/free-plan-benefits/free-plan-benefits.component';

@Component({
  selector: 'wil-register-free-account',
  standalone: true,
  imports: [FreePlanBenefitsComponent, CompleteSignupFormComponent],
  templateUrl: './register-free-account.component.html',
  styleUrl: './register-free-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFreeAccountComponent {}
