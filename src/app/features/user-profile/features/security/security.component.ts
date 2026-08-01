import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ResetPasswordFormComponent } from '../../../reset-password/ui/reset-password-form/reset-password-form.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'wil-security',
  standalone: true,
  imports: [ResetPasswordFormComponent, MatCard, MatCardContent, MatCardHeader, MatCardTitle],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityComponent {}
