import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { GdprExportResponse } from './gdpr.types';

/**
 * GDPR data service for API communication.
 * Handles all HTTP requests related to GDPR operations.
 */
@Injectable({
  providedIn: 'root',
})
export class GdprDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Create a new GDPR data export request
   * @returns Observable<GdprExportResponse> on success
   * @throws HttpErrorResponse on failure
   */
  public createExport(): Observable<GdprExportResponse> {
    return this.http
      .post<GdprExportResponse>(
        `${this.apiUrl}/gdpr/exports`,
        {},
        {
          withCredentials: true, // Important: Include cookies for authentication
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.mapError(error));
        })
      );
  }

  /**
   * Get GDPR exports
   * @returns Observable<GdprExportResponse[]> on success
   * @throws HttpErrorResponse on failure
   */
  public getExports(): Observable<GdprExportResponse[]> {
    return this.http.get<GdprExportResponse[]>(`${this.apiUrl}/gdpr/exports`).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => this.mapError(error));
      })
    );
  }

  /**
   * Get download SAS URL from backend
   * @param downloadUrl - The backend download endpoint path
   * @returns Observable<string> - The SAS URL for direct download
   */
  public getDownloadUrl(downloadUrl: string): Observable<string> {
    return this.http.get<{ sasUrl: string }>(`${this.apiUrl}${downloadUrl}`).pipe(
      map((response) => response.sasUrl),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => this.mapError(error));
      })
    );
  }

  /**
   * Delete user account permanently
   * @returns Observable<void> on success
   * @throws HttpErrorResponse on failure
   */
  public deleteAccount(): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/gdpr/me`, {
        withCredentials: true,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.mapError(error));
        })
      );
  }

  /**
   * Map HTTP errors to a consistent format
   * @param error - HTTP error response
   * @returns Mapped error object
   */
  private mapError(error: HttpErrorResponse) {
    return {
      status: error.status,
      message: error.error?.message || 'An unexpected error occurred',
      code: error.error?.code || 'UNKNOWN_ERROR',
    };
  }
}
