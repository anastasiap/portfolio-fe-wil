import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AccountEmailPreferences, AccountLegalConsentsDto, AccountLegalConsentsRequest, AuthError } from '../auth/auth.types';

/**
 * Accounts data service for API communication.
 * Handles all HTTP requests related to account data and preferences.
 */
@Injectable({
  providedIn: 'root',
})
export class AccountsDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Update user's email preferences
   * @param patch - Partial email preferences to update
   * @returns Observable<AccountEmailPreferences> on success
   * @throws HttpErrorResponse on failure
   */
  public updateMyEmailPreferences(
    patch: Partial<{ productUpdates: boolean; educationalContent: boolean; marketingContent: boolean }>
  ): Observable<AccountEmailPreferences> {
    return this.http
      .patch<AccountEmailPreferences>(`${this.apiUrl}/accounts/preferences/email`, patch, {
        withCredentials: true, // Include credentials if required
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Accept legal consents (Terms of Service and Privacy Policy)
   * @param request - Legal consents request with version information
   * @returns Observable<AccountLegalConsentsDto> on success
   * @throws HttpErrorResponse on failure
   */
  public acceptLegalConsents(request: AccountLegalConsentsRequest): Observable<AccountLegalConsentsDto> {
    return this.http
      .patch<AccountLegalConsentsDto>(`${this.apiUrl}/accounts/legal-consents`, request, {
        withCredentials: true, // Include credentials since this is after account creation
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Handle HTTP errors and convert to user-friendly messages
   * Following the same pattern as AuthDataService
   */
  private handleError(error: HttpErrorResponse): AuthError {
    // Client-side or network error
    if (error.error instanceof ErrorEvent) {
      return {
        message: 'A network error occurred. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }

    // Backend returned an unsuccessful response code
    const statusCode = error.status;
    let message: string;
    let code: string;

    switch (statusCode) {
      case 401:
        message = 'You are not authorized to access this resource. Please log in.';
        code = 'UNAUTHORIZED';
        break;
      case 403:
        message = 'You do not have permission to update these preferences.';
        code = 'FORBIDDEN';
        break;
      case 400:
        message = 'Invalid preferences data. Please check your input and try again.';
        code = 'INVALID_DATA';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        code = 'RATE_LIMIT_EXCEEDED';
        break;
      case 500:
      case 502:
      case 503:
        message = 'Server error. Please try again later.';
        code = 'SERVER_ERROR';
        break;
      default:
        message = 'An unexpected error occurred. Please try again.';
        code = 'UNKNOWN_ERROR';
    }

    return {
      message,
      code,
      statusCode,
    };
  }
}
