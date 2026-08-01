import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';
import { BASE } from '../../../../configs/routes.config';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../../state/auth/auth.actions';

type PersonalLandingPlanType = Extract<PlanType, 'free' | 'personal'>;

@Component({
  selector: 'wil-landing-personal-plan',
  standalone: true,
  imports: [CtaButtonComponent],
  templateUrl: './landing-personal-plan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPersonalPlanComponent implements OnInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  public readonly planType = signal<PersonalLandingPlanType>(this.getRoutePlanType());

  public readonly planLabel = computed(() => (this.planType() === 'free' ? 'Free' : 'Personal'));
  public readonly planSource = computed(() => `${this.planType()}_plan_landing`);
  public readonly heroEyebrow = computed(() =>
    this.planType() === 'free' ? 'Free Plan - start your own regular check-ins' : 'Personal Plan - for your own regular check-ins'
  );
  public readonly ctaDescription = computed(() =>
    this.planType() === 'free'
      ? 'It takes a few minutes to start. Create your account and begin with the free plan.'
      : 'It takes a few minutes to start. If the structure clicks, you will keep using it. If not, you have at least spent less than on an indifferent sandwich.'
  );

  private firedBuckets = new Set<number>();
  private scrollSubscription?: Subscription;
  private readonly scrollThresholds = [25, 50, 75, 90];

  ngOnInit(): void {
    this.analytics.track('personal_plan_landing_viewed', {
      plan: this.planType(),
      source: this.planSource(),
    });

    // Reset fired buckets on component init
    this.firedBuckets.clear();

    // Start scroll tracking on client side only
    if (typeof window !== 'undefined') {
      // Always scroll to top when landing on this page
      window.scrollTo(0, 0);
      this.initScrollTracking();
    }
  }

  ngOnDestroy(): void {
    this.scrollSubscription?.unsubscribe();
  }

  private initScrollTracking(): void {
    this.scrollSubscription = fromEvent(window, 'scroll')
      .pipe(debounceTime(150))
      .subscribe(() => {
        this.trackScrollDepth();
      });
  }

  private trackScrollDepth(): void {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) return; // Avoid division by zero

    const scrollPercent = (scrollTop / docHeight) * 100;

    //% users who never reach 25% → hero is failing
    // Drop between 25 → 50 → message not engaging
    // High 75/90 but low CTA clicks → copy reads but doesn’t convert
    this.scrollThresholds.forEach((threshold) => {
      if (scrollPercent >= threshold && !this.firedBuckets.has(threshold)) {
        this.analytics.track('personal_landing_scrolled', {
          plan: this.planType(),
          scroll_depth_bucket: threshold,
          source: this.planSource(),
        });
        this.firedBuckets.add(threshold);
      }
    });
  }

  public onPlanSelected(ctaLocation: 'top' | 'bottom' = 'top'): void {
    const plan = this.planType();

    this.analytics.track('personal_signup_cta_clicked', {
      plan,
      cta_location: ctaLocation,
      source: this.planSource(),
    });

    if (plan === 'free') {
      this.analytics.track('plan_selected', {
        plan,
        cta_location: ctaLocation,
        source: this.planSource(),
      });

      this.router.navigate(['/register-free-account']);
      return;
    }

    this.analytics.track('checkout_started', {
      plan,
      source: this.planSource(),
    });

    const successUrl = `${window.location.origin}/${BASE}/account`;
    const cancelUrl = `${window.location.origin}/plans`;

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

  private getRoutePlanType(): PersonalLandingPlanType {
    const navigationState = this.router.getCurrentNavigation()?.extras.state;
    const historyState = typeof window === 'undefined' ? null : window.history.state;
    const routePlanType = navigationState?.['planType'] ?? historyState?.['planType'] ?? this.route.snapshot.data['planType'];

    return routePlanType === 'free' ? 'free' : 'personal';
  }
}
