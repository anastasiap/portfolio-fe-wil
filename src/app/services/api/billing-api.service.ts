import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateCheckoutSessionDto,
  CreateCheckoutSessionResponseDto,
  CreatePortalSessionRequestDto,
  CreatePortalSessionResponseDto,
  CreateUpgradeCheckoutSessionRequest,
  CreateUpgradeCheckoutSessionResponse,
  ResubscribeResponseDto,
} from './dto/billing';

export type Coupons = 'EARLY_ACCESS';

@Injectable({
  providedIn: 'root',
})
export class BillingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  public createStripeCheckoutSession(request: CreateCheckoutSessionDto): Observable<CreateCheckoutSessionResponseDto> {
    return this.http.post<CreateCheckoutSessionResponseDto>(`${this.baseUrl}/billing/create-stripe-checkout-session`, request);
  }

  public getMySubscription(): Observable<GetMySubscriptionResponseDto> {
    return this.http.get<GetMySubscriptionResponseDto>(`${this.baseUrl}/users/me/subscription`);
  }

  public createPortalSession(request: CreatePortalSessionRequestDto): Observable<CreatePortalSessionResponseDto> {
    return this.http.post<CreatePortalSessionResponseDto>(`${this.baseUrl}/users/me/portal-session`, request);
  }

  public createUpgradeCheckoutSession(request: CreateUpgradeCheckoutSessionRequest): Observable<CreateUpgradeCheckoutSessionResponse> {
    return this.http.post<CreateUpgradeCheckoutSessionResponse>(`${this.baseUrl}/billing/create-upgrade-checkout-session`, request, {
      withCredentials: true,
    });
  }

  public resubscribe(): Observable<ResubscribeResponseDto> {
    return this.http.post<ResubscribeResponseDto>(`${this.baseUrl}/billing/resubscribe`, {});
  }
}
