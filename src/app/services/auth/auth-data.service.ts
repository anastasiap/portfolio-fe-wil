import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  AuthError,
  CompleteSignupRequest,
  CompleteSignupResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  PendingSignupResponse,
  RegisterDto,
  RefreshResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
  ResetPasswordWithTokenRequest,
} from './auth.types';

/**
 * Authentication data service for API communication.
 * Handles all HTTP requests related to authentication.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Login user with email and password
   * @param credentials - Email and password
   * @returns Observable<LoginResponse> on success
   * @throws HttpErrorResponse on failure
   */
  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials, {
        withCredentials: true, // Important: Include cookies for httpOnly refreshToken
        observe: 'response', // Get full response to inspect headers/cookies
      })
      .pipe(
        map((response) => response.body as LoginResponse),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Refresh access token using httpOnly refresh cookie
   * @returns Observable<RefreshResponse> with new accessToken
   * @throws HttpErrorResponse on failure (e.g., expired refresh token)
   *
   * Note: The refresh token is automatically sent via httpOnly cookie.
   * The backend rotates the refresh token and sets a new cookie in the response.
   * Frontend never handles refresh tokens directly for security.
   */
  public refresh(): Observable<RefreshResponse> {
    return this.http
      .post<RefreshResponse>(
        `${this.apiUrl}/auth/refresh`,
        {}, // Empty body - refresh token is in httpOnly cookie
        {
          withCredentials: true, // Critical: Include httpOnly refresh cookie
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // For refresh, 401/403 are expected when no valid session exists
          if (error.status === 401 || error.status === 403) {
            // Return a specific "no session" indicator rather than a user error
            return throwError(() => ({
              code: 'NO_VALID_SESSION',
              statusCode: error.status,
              expected: true, // Flag to indicate this is expected
            }));
          }

          // Other errors (network, 5xx) are still actual problems
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Get current authenticated user session data
   * @returns Observable<MeResponse> with user, account, and entitlements
   * @throws HttpErrorResponse on failure (e.g., unauthorized)
   *
   * Note: This endpoint requires a valid access token in the Authorization header.
   * The AuthInterceptor automatically attaches the token from TokenMemoryService.
   * Typically called after refresh() to reload session data.
   */
  public me(): Observable<MeResponse> {
    const cacheBuster = Math.random().toString(36).substring(7);

    return this.http
      .get<MeResponse>(`${this.apiUrl}/users/me?_cb=${cacheBuster}`, {
        withCredentials: true,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Logout user and invalidate refresh token cookie
   * @returns Observable<void> on success
   * @throws HttpErrorResponse on failure (non-critical, logout continues)
   *
   * Note: This endpoint should clear the httpOnly refresh token cookie server-side.
   * The frontend will clear the access token from memory regardless of backend response.
   * Uses withCredentials to ensure cookies are sent for invalidation.
   */
  public logout(): Observable<void> {
    return this.http
      .post<void>(
        `${this.apiUrl}/auth/logout`,
        {}, // Empty body
        {
          withCredentials: true, // Critical: Include httpOnly refresh cookie for invalidation
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Log error but don't propagate - logout should complete on frontend
          console.warn('Backend logout failed, but continuing with local logout:', error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Get pending signup status
   * @param signupId - The signup ID from Stripe redirect
   * @returns Observable<PendingSignupResponse> with signup status
   * @throws HttpErrorResponse on failure
   *
   * Note: This endpoint does NOT require authentication.
   * It's used after Stripe redirect to check payment status before account completion.
   */
  public getPendingSignup(signupId: string): Observable<PendingSignupResponse> {
    return this.http.get<PendingSignupResponse>(`${this.apiUrl}/auth/pending-signup/${signupId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Complete a pending signup by creating the user account
   * @param request - Signup completion data (signupId, firstName, lastName, password)
   * @returns Observable<CompleteSignupResponse> with user and tokens
   * @throws HttpErrorResponse on failure
   *
   * Note: This endpoint does NOT require authentication.
   * It's used after payment is confirmed to finalize the account creation.
   * Returns tokens that can be used to log the user in immediately.
   */
  public completeSignup(request: CompleteSignupRequest): Observable<CompleteSignupResponse> {
    return this.http
      .post<CompleteSignupResponse>(`${this.apiUrl}/auth/complete-signup`, request, {
        withCredentials: true, // Include cookies for httpOnly refreshToken
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  public register(dto: RegisterDto): Observable<CompleteSignupResponse> {
    return this.http
      .post<CompleteSignupResponse>(`${this.apiUrl}/auth/register`, dto, {
        withCredentials: true,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        })
      );
  }

  /**
   * Request password reset via email
   * @param email - Email address to send the reset link to
   * @returns Observable<RequestPasswordResetResponse> with confirmation message
   * @throws HttpErrorResponse on failure
   *
   * Note: This endpoint does NOT require authentication.
   * It always returns a success message for security reasons (no user enumeration).
   */
  public requestPasswordReset(email: string): Observable<RequestPasswordResetResponse> {
    return this.http.post<RequestPasswordResetResponse>(`${this.apiUrl}/auth/password/forgot-password`, { email }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Reset password using reset token
   * @param request - Reset token and new password
   * @returns Observable<ResetPasswordResponse> with confirmation message
   * @throws HttpErrorResponse on failure
   *
   * Note: This endpoint does NOT require authentication.
   * IMPORTANT: Error handling preserves backend error payload to allow UI to map
   * specific error codes like INVALID_OR_EXPIRED_TOKEN.
   */
  public resetPasswordWithToken(request: ResetPasswordWithTokenRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/auth/password/reset-password-with-token`, request).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error); // IMPORTANT: do not map via handleError here
      })
    );
  }

  public resetPassword(newPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/auth/password/reset-password`, { newPassword }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error); // IMPORTANT: do not map via handleError here
      })
    );
  }

  public sendVerificationEmail(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/email-verification/resend-verification`, {});
  }

  /**
   * Verify email using verification token
   * @param token - Email verification token from URL
   * @returns Observable<{ message: string }> with success confirmation
   * @throws HttpErrorResponse on failure (400 for invalid/expired token)
   *
   * Note: This endpoint does NOT require authentication.
   * IMPORTANT: Error handling preserves backend error payload to allow UI to map
   * specific error codes like INVALID_OR_EXPIRED_TOKEN.
   */
  public verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/email-verification/verify-email`, { token }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error); // IMPORTANT: do not map via handleError here
      })
    );
  }

  /**
   * Handle HTTP errors and convert to user-friendly messages
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
        message = 'Invalid email or password. Please try again.';
        code = 'INVALID_CREDENTIALS';
        break;
      case 403:
        message = 'Your account has been suspended. Please contact support.';
        code = 'ACCOUNT_SUSPENDED';
        break;
      case 429:
        message = 'Too many login attempts. Please try again later.';
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
