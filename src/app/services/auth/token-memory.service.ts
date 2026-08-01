import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * In-memory token storage service.
 * Stores access tokens in memory only - never in localStorage or sessionStorage.
 * Token is lost on page refresh (intentional security feature).
 * Refresh token is managed by backend via httpOnly cookies.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenMemoryService {
  private readonly accessTokenSubject = new BehaviorSubject<string | null>(null);
  public readonly accessToken$: Observable<string | null> = this.accessTokenSubject.asObservable();

  public getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  /**
   * Set the access token in memory
   * @param token - The JWT access token, or null to clear
   */
  public setAccessToken(token: string | null): void {
    this.accessTokenSubject.next(token);
  }

  /**
   * Clear the access token from memory
   */
  public clear(): void {
    this.accessTokenSubject.next(null);
  }

  /**
   * Check if an access token is currently stored
   * @returns true if token exists and is not empty, false otherwise
   */
  public hasToken(): boolean {
    const token = this.accessTokenSubject.value;
    return token !== null && token.length > 0;
  }
}
