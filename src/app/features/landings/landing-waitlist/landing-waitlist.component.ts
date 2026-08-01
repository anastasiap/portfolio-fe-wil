import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import { BASE } from '../../../../configs/routes.config';
import * as AuthActions from '../../../state/auth/auth.actions';
import { Store } from '@ngrx/store';

@Component({
  selector: 'wil-landing-waitlist',
  standalone: true,
  imports: [CtaButtonComponent],
  templateUrl: './landing-waitlist.component.html',
  styleUrl: './landing-waitlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingWaitlistComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly meta = inject(Meta);
  private readonly store = inject(Store);

  ngOnInit() {
    // Prevent crawlers from indexing this page
    this.meta.addTags([
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'googlebot', content: 'noindex, nofollow' },
    ]);
  }

  public onPlanSelected(ctaLocation: 'top' | 'bottom' = 'top'): void {
    this.analytics.track('personal_signup_cta_clicked', {
      cta_location: ctaLocation,
      source: 'early_adopters_landing',
    });

    this.analytics.track('checkout_started', {
      plan: 'personal',
      source: 'early_adopters_landing',
    });

    const successUrl = `${window.location.origin}/${BASE}/account`;
    const cancelUrl = `${window.location.origin}/plans`;

    this.store.dispatch(
      AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          coupon: 'EARLY_ACCESS',
          successUrl,
          cancelUrl,
        },
      })
    );
  }
}
