import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

import { AuthDataService } from './auth-data.service';
import { TokenMemoryService } from './token-memory.service';
import { authSessionExpired } from '../../state/auth/auth.actions';

/**
 * HTTP Interceptor for authentication
 *
 * Responsibilities:
 * 1. Attach access token to outgoing requests
 * 2. Automatically refresh token on 401 responses
 * 3. Implement single-flight refresh (only one refresh at a time)
 * 4. Retry failed requests after successful refresh
 * 5. Handle refresh failures by clearing tokens and logging out
 *
 * @security Access tokens are added to Authorization header
 * @security Refresh uses httpOnly cookies (withCredentials: true)
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly tokenMemoryService = inject(TokenMemoryService);
  private readonly authDataService = inject(AuthDataService);
  private readonly store = inject(Store);

  private refreshInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  public intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add access token to request if available
    const modifiedReq = this.addAuthHeader(req);

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only handle 401 Unauthorized errors
        if (error.status === 401) {
          return this.handle401Error(modifiedReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Add Authorization header with access token if available
   */
  private addAuthHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.tokenMemoryService.getAccessToken();

    if (token && this.shouldAddAuthHeader(req)) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return req;
  }

  /**
   * Determine if Authorization header should be added
   * Skip for login/refresh endpoints to avoid conflicts
   */
  private shouldAddAuthHeader(req: HttpRequest<unknown>): boolean {
    const url = req.url.toLowerCase();
    return !url.includes('/auth/login') && !url.includes('/auth/refresh');
  }

  /**
   * Handle 401 Unauthorized error with token refresh
   * Implements single-flight pattern: only one refresh at a time
   */
  private handle401Error(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Don't try to refresh if the failing request is login or refresh itself
    if (this.isAuthEndpoint(req)) {
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }

    // If refresh is already in progress, wait for it
    if (this.refreshInProgress) {
      return this.waitForRefreshAndRetry(req, next);
    }

    // Start new refresh
    return this.performRefresh(req, next);
  }

  /**
   * Check if request is to an auth endpoint (login or refresh)
   * These should not trigger refresh logic to avoid infinite loops
   */
  private isAuthEndpoint(req: HttpRequest<unknown>): boolean {
    const url = req.url.toLowerCase();
    return url.includes('/auth/login') || url.includes('/auth/refresh');
  }

  /**
   * Wait for ongoing refresh to complete and retry request
   */
  private waitForRefreshAndRetry(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null), // Wait until new token is emitted
      take(1), // Only take the first emission
      switchMap((token) => {
        // Retry request with new token
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: req.withCredentials, // Preserve credentials flag
        });
        return next.handle(retryReq);
      })
    );
  }

  /**
   * Perform token refresh and retry request
   * Single-flight: only one refresh happens at a time
   */
  private performRefresh(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.refreshInProgress = true;
    this.refreshTokenSubject.next(null); // Reset subject

    return this.authDataService.refresh().pipe(
      switchMap((response) => {
        // Store new access token
        this.tokenMemoryService.setAccessToken(response.accessToken);

        // Notify waiting requests
        this.refreshTokenSubject.next(response.accessToken);

        // Reset flag
        this.refreshInProgress = false;

        // Retry original request with new token
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${response.accessToken}`,
          },
          withCredentials: req.withCredentials, // Preserve credentials flag
        });
        return next.handle(retryReq);
      }),
      catchError((error: HttpErrorResponse) => {
        // Refresh failed - session expired
        this.refreshInProgress = false;
        this.refreshTokenSubject.error(error);
        this.refreshTokenSubject = new BehaviorSubject<string | null>(null);

        // Clear token and logout
        this.tokenMemoryService.clear();
        this.store.dispatch(authSessionExpired());

        // Propagate error
        return throwError(() => error);
      })
    );
  }
}
