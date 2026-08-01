/**
 * Authentication-related type definitions
 * These match the backend API contract for /auth/login
 */

/**
 * System-wide roles for authorization
 */
export type SystemRole = 'user' | 'coach' | 'admin';

/**
 * User account status
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * Authentication metadata for a user
 */
export interface UserAuth {
  readonly mfaEnabled: boolean;
  readonly lastLoginAt: string; // ISO 8601 date string
}

/**
 * Audit timestamps for a user
 */
export interface UserAudit {
  readonly createdAt: string; // ISO 8601 date string
  readonly updatedAt: string; // ISO 8601 date string
}

/**
 * User information returned from authentication
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly name?: string;
  readonly secondName?: string;
  readonly systemRole: SystemRole;
  readonly status: UserStatus;
  readonly auth: UserAuth;
  readonly audit: UserAudit;
}

/**
 * Email preferences for a user account
 */
export interface AccountEmailPreferences {
  readonly productUpdates: boolean;
  readonly educationalContent: boolean;
  readonly marketingContent: boolean;
  readonly updatedAt?: string;
}

/**
 * Account preferences
 */
export interface AccountPreferences {
  readonly email?: AccountEmailPreferences;
}

/**
 * Account information (placeholder - extend as needed)
 */
export interface Account {
  readonly id: string;
  readonly name?: string;
  readonly type?: string;
  readonly preferences?: AccountPreferences;
  readonly legalConsents?: AccountLegalConsentsDto;
}

/**
 * Entitlements/permissions for the user (placeholder - extend as needed)
 */
export interface Entitlements {
  readonly features: string[];
  readonly limits?: Record<string, number>;
}

/**
 * Authentication tokens returned from login
 */
export interface AuthTokens {
  readonly accessToken: string;
}

/**
 * Complete response from POST /auth/login
 */
export interface LoginResponse {
  readonly user: User;
  readonly tokens: AuthTokens;
  readonly account?: Account;
  readonly entitlements?: Entitlements;
}

/**
 * Request payload for POST /auth/login
 */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

/**
 * Response from POST /auth/refresh
 */
export interface RefreshResponse {
  readonly accessToken: string;
}

/**
 * Response from GET /auth/me
 * Returns current authenticated user session data
 */
export interface MeResponse {
  readonly user: User;
  readonly account: AccountOutputDto;
  readonly subscription: MySubscriptionState;
  readonly entitlements: Entitlements;
}

export interface AccountOutputDto {
  id: string;
  type: PlanType;
  ownerUserId: string;
  profileId?: string;
  coachProfileId?: string;
  defaultWheelId?: string;
  preferences: AccountPreferencesOutput;
  legalConsents?: AccountLegalConsentsDto;
  audit: AccountAuditOutput;
}

export interface AccountAuditOutput {
  createdAt: string;
  updatedAt: string;
}

export interface AccountPreferencesOutput {
  email: AccountEmailPreferencesDto;
}

export interface AccountEmailPreferencesDto {
  productUpdates: boolean;
  educationalContent: boolean;
  marketingContent: boolean;
  updatedAt?: string;
}
export type SubscriptionProvider = 'stripe' | 'paypal' | 'manual';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export interface Subscription {
  accountId: string; // FK to accounts.id
  provider: SubscriptionProvider;
  customerId?: string;
  subscriptionId?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  renewsAt?: Date;
  cancelAtPeriodEnd: boolean;
  priceCents?: number;
  billingInterval?: 'month' | 'year';
  currency?: string;
  stripePriceId?: string;
  stripeProductId?: string;
  createdAt: Date;
  updatedAt: Date;
  id: string;
}

/**
 * Pending signup status states
 */
export type PendingSignupStep = 'waiting_payment' | 'create_password' | 'already_completed' | 'canceled';
export type SignupStatus = 'initiated' | 'paid' | 'completed' | 'canceled';

/**
 * Response from GET /auth/pending-signup/:signupId
 * Returns the status of a pending signup after Stripe payment
 */
export interface PendingSignupResponse {
  readonly status: SignupStatus;
  readonly step: PendingSignupStep;
  plan: 'personal' | 'professional';
  email: string;
}

export type SignupCompletionState =
  | 'loading'
  | 'waiting_payment'
  | 'already_completed'
  | 'ready_to_complete'
  | 'canceled'
  | 'not_found'
  | 'error';

export interface PendingSignupData extends PendingSignupResponse {
  readonly signupId: string;
}

/**
 * Request payload for POST /auth/complete-signup
 * Completes a pending signup by creating the user account
 */
export interface CompleteSignupRequest {
  readonly signupId: string;
  readonly name: string;
  readonly secondName: string;
  readonly password: string;
}

export interface CompleteSignupProps {
  readonly signupId: string;
  readonly name: string;
  readonly secondName: string;
  readonly password: string;
  readonly plan: PlanType;
}

export interface CompleteRegistrationProps {
  readonly email: string;
  readonly name: string;
  readonly secondName: string;
  readonly password: string;
  readonly plan: PlanType;
}

export interface RegisterDto {
  readonly email: string;
  readonly name: string;
  readonly secondName: string;
  readonly password: string;
  readonly plan: PlanType;
}

/**
 * Response from POST /auth/complete-signup
 * Returns the created user and authentication tokens
 */
export interface CompleteSignupResponse {
  readonly user: User;
  readonly subscription: Subscription;
  readonly account?: Account;
  readonly entitlements?: Entitlements;
  readonly accessToken: string;
}

/**
 * Error response from authentication endpoints
 */
export interface AuthError {
  readonly message: string;
  readonly code?: string;
  readonly statusCode?: number;
}

/**
 * Request payload for accepting legal consents
 */
export interface AccountLegalConsentsRequest {
  readonly termsAccepted: boolean;
  readonly privacyAccepted: boolean;
  readonly termsVersion: string;
  readonly privacyVersion: string;
}

/**
 * Response from legal consents endpoint
 */
export interface AccountLegalConsentsDto {
  readonly termsAccepted: boolean;
  readonly privacyAccepted: boolean;
  readonly termsVersion: string;
  readonly privacyVersion: string;
  readonly acceptedAt: Date;
}

/**
 * Request payload for requesting password reset
 */
export interface RequestPasswordResetRequest {
  readonly email: string;
}

/**
 * Response from password reset request endpoint
 */
export interface RequestPasswordResetResponse {
  readonly message: string;
}

/**
 * Request payload for resetting password
 */
export interface ResetPasswordWithTokenRequest {
  readonly token: string;
  readonly newPassword: string;
}

/**
 * Response from password reset endpoint
 */
export interface ResetPasswordResponse {
  readonly message: string;
}

/**
 * Standard API error payload from backend
 */
export interface ApiErrorPayload {
  readonly code: string | number;
  readonly message: string;
}

export interface MySubscriptionState extends GetMySubscriptionResponseDto {
  entitlementsLabels: string[];
}
