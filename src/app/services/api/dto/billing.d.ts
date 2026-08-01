import { SubscriptionStatus } from '../../auth/auth.types';
import { Coupons } from '../billing-api.service';

export interface CreateCheckoutSessionDto {
  plan: PlanType;
  coupon?: Coupons;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponseDto {
  sessionUrl: string;
  sessionId: string;
}

export interface CreatePortalSessionRequestDto {
  returnUrl: string;
}

export interface CreatePortalSessionResponseDto {
  url: string;
}

export interface CreateUpgradeCheckoutSessionRequest {
  targetPlan: 'personal';
  successUrl: string;
  cancelUrl: string;
}

export interface CreateUpgradeCheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string;
}

export interface ResubscribeResponseDto {
  success: boolean;
  message: string;
  subscriptionStatus: SubscriptionStatus;
  renewsAt: string;
}
