import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GaEventsSource } from '../../../services/analytics/analytics.service';
import { LockedFeatureDialogData } from './typings';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';
import { PLANS } from '../../../../configs/plan.config';

/**
 * Plan selection content component for the auth modal register view.
 * Displays two stacked plan cards (Personal & Professional) for user selection.
 */
@Component({
  selector: 'wil-plan-select-modal-content',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CtaButtonComponent],
  templateUrl: './plan-select-modal-content.component.html',
  styleUrl: './plan-select-modal-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanSelectModalContentComponent {
  private readonly router = inject(Router);
  private readonly dialogData = inject<LockedFeatureDialogData>(MAT_DIALOG_DATA);

  public readonly navigateBack = output<void>();
  public readonly selectPlan = output<PlanType>();
  public readonly navigateToLanding = output<void>();

  public readonly loading = signal(false);

  public readonly planData: PlanCardData[] = PLANS;
  public readonly source: GaEventsSource = this.dialogData.source;

  public onBackClick(): void {
    this.navigateBack.emit();
  }

  public navigate(e: Event): void {
    e.preventDefault();
    this.navigateToLanding.emit();
    this.router.navigate(['/how-personal-plan-works'], { state: { planType: 'free' } });
  }

  public onPlanCtaClick(planData: PlanCardData): void {
    if (planData.planType === 'Free') {
      this.loading.set(true);
      this.selectPlan.emit('free');
    } else if (planData.planType === 'Personal') {
      this.loading.set(true);
      this.selectPlan.emit('personal');
    } else if (planData.planType === 'Professional') {
      this.selectPlan.emit('professional');
    }
  }
}
