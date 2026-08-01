import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { BASE } from '../../../../../configs/routes.config';
import { AnalyticsService } from '../../../../services/analytics/analytics.service';
import * as AuthActions from '../../../../state/auth/auth.actions';

@Component({
  selector: 'wil-personal-plan-feature-promotion',
  standalone: true,
  imports: [CtaButtonComponent],
  templateUrl: './personal-plan-feature-promotion.component.html',
  styleUrl: './personal-plan-feature-promotion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalPlanFeaturePromotionComponent {
  private readonly store = inject(Store);
  private readonly analytics = inject(AnalyticsService);

  public onPlanSelected(ctaLocation: 'top' | 'bottom' = 'top'): void {
    this.analytics.track('personal_signup_cta_clicked', {
      cta_location: ctaLocation,
      source: 'home_page',
    });

    this.analytics.track('checkout_started', {
      plan: 'personal',
      source: 'home_page',
    });

    this.store.dispatch(
      AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          successUrl: `${window.location.origin}/${BASE}/account`,
          cancelUrl: `${window.location.origin}/plans`,
        },
      })
    );
  }
}
