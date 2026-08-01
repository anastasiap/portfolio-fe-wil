import { inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Canonical GA4 events from analytics tracking plan
 */
export type CanonicalEvents =
  | 'choose_plan_viewed'
  | 'plan_selected'
  | 'personal_plan_landing_viewed'
  | 'personal_landing_scrolled'
  | 'personal_signup_cta_clicked'
  | 'professional_interest_viewed'
  | 'professional_interest_submitted'
  | 'login_entry_clicked'
  | 'signup_entry_clicked'
  | 'fake_door_clicked'
  | 'start_personal_plan_viewed'
  | 'start_personal_plan_cancelled'
  | 'checkout_started'
  | 'download_modal_opened'
  | 'download_preview_shown'
  | 'start_tracking_clicked';

/**
 * Legacy events for backward compatibility
 */
export type LegacyEvents =
  | 'click_save_results_locked'
  | 'click_save_categories_locked'
  | 'modal_send_interest_attempt'
  | 'modal_send_interest_success'
  | 'modal_send_interest_error'
  | 'click_paid_plan_personal_cta'
  | 'click_paid_plan_professional_cta'
  | 'waitlist_signup_attempt'
  | 'waitlist_signup_success'
  | 'waitlist_signup_error'
  | 'client_view_opened';

export type AnalyticsEvents = CanonicalEvents | LegacyEvents;

/**
 * Shared parameters for canonical events
 */
export interface AnalyticsParams {
  source?: string;
  plan?: PlanType;
  cta_location?: string;
  fake_door_type?: string;
  result?: 'success' | 'error' | 'validation_failed';
  scroll_depth_bucket?: number;
}

/**
 * Legacy event sources for backward compatibility
 */
export type GaEventsSource = 'save_categories' | 'save_results' | 'personal_cta' | 'professional_cta' | 'client_view';

declare global {
  interface Window {
    gtag: (command: 'event', eventName: string, params?: AnalyticsParams) => void;
  }
}

/**
 * Central analytics service for GA4 event tracking
 * Replaces direct window.gtag calls and trackGaEvent util function
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Track an analytics event with optional parameters
   * @param eventName - Canonical or legacy event name
   * @param params - Event parameters object
   */
  track(eventName: AnalyticsEvents, params?: AnalyticsParams): void {
    // No-op on server side
    if (!isPlatformBrowser(this.platformId) || isDevMode()) {
      return;
    }

    // No-op when gtag is not available
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }

    // Send event to GA4
    window.gtag('event', eventName, params || {});
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use track() method instead
   */
  trackLegacyEvent(eventName: LegacyEvents, source: GaEventsSource): void {
    this.track(eventName, { source });
  }
}
