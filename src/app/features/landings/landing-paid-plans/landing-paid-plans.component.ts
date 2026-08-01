import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SeoService } from '../../../services/seo/seo.service';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import { PlanCardComponent } from '../../../ui/plan-card/plan-card.component';
import { PLANS_DATA } from '../../wheel/wheel.constants';
import { PaymentMethodModalComponent } from '../../../ui/modals/payment-method-modal/payment-method-modal.component';
import { WaitlistModalComponent } from '../../../ui/modals/waitlist-modal/waitlist-modal.component';

@Component({
  selector: 'wil-landing-paid-plans',
  standalone: true,
  imports: [PlanCardComponent],
  templateUrl: './landing-paid-plans.component.html',
  styleUrls: ['./landing-paid-plans.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPaidPlansComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);

  public plans: PlanCardData[] = PLANS_DATA;

  ngOnInit(): void {
    const routeData = this.route.snapshot.data;
    this.seoService.updateSeoTags({
      title: routeData['title'],
      description: routeData['description'],
    });
  }

  public onPlanCtaClick(planData: PlanCardData): void {
    switch (planData.planType) {
      case 'Free':
        {
          this.analytics.track('plan_selected', {
            plan: 'free',
            source: 'plans_page',
            cta_location: 'plan_card',
          });

          this.router.navigate(['/register-free-account']);
        }
        break;
      case 'Personal':
        {
          this.analytics.track('plan_selected', {
            plan: 'personal',
            source: 'plans_page',
            cta_location: 'plan_card',
          });

          this.openPaymentMethodModal(planData);
        }
        break;
      case 'Professional':
        {
          this.analytics.track('professional_interest_viewed', {
            source: 'plans_page',
          });

          this.openWaitlistModal(planData);
        }
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }

  private openPaymentMethodModal(planData: PlanCardData): void {
    const dialogData: PaymentMethodDialogData = {
      planName: planData.planType?.toLowerCase() as PlanType,
      planDisplayName: planData.planType,
      price: `${planData.price}`,
      subtext: `${planData.priceSubtext}`,
    };

    this.analytics.track('start_personal_plan_viewed', {
      plan: 'personal',
      source: 'plans_page',
    });

    this.dialog.open(PaymentMethodModalComponent, {
      data: dialogData,
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: true,
      panelClass: 'modal-panel',
    });
  }

  private openWaitlistModal(planData: PlanCardData): void {
    const dialogData: AnalyticsDialogData = {
      planType: planData.planType as 'Personal' | 'Professional',
      source: 'plans_page',
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
