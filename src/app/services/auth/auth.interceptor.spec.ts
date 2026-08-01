import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AuthInterceptor } from './auth.interceptor';
import { TokenMemoryService } from './token-memory.service';
import { AuthDataService } from './auth-data.service';
import { authSessionExpired } from '../../state/auth/auth.actions';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let tokenMemoryService: TokenMemoryService;
  let store: MockStore;
  let interceptor: AuthInterceptor;

  const apiUrl = '/api';
  const testToken = 'test-access-token-12345';
  const newToken = 'new-refreshed-token-67890';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        TokenMemoryService,
        AuthDataService,
        provideMockStore(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenMemoryService = TestBed.inject(TokenMemoryService);
    store = TestBed.inject(MockStore);
    interceptor = TestBed.inject(AuthInterceptor);

    spyOn(store, 'dispatch');
  });

  afterEach(() => {
    httpMock.verify();
    tokenMemoryService.clear();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('Authorization Header Attachment', () => {
    it('should attach Authorization header when token exists', () => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);

      req.flush({ id: 'user123' });
    });

    it('should not attach Authorization header when no token exists', () => {
      // Arrange - No token set
      tokenMemoryService.clear();

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe();

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({ id: 'user123' });
    });

    it('should not attach Authorization header to /auth/login', () => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.post(`${apiUrl}/auth/login`, { email: 'test@example.com', password: 'pass' }).subscribe();

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({ tokens: { accessToken: 'new-token' } });
    });

    it('should not attach Authorization header to /auth/refresh', () => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.post(`${apiUrl}/auth/refresh`, {}).subscribe();

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({ accessToken: 'new-token' });
    });
  });

  describe('401 Error Handling - Token Refresh', () => {
    it('should refresh token and retry request on 401', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);
      const expectedData = { id: 'user123', email: 'user@example.com' };

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe({
        next: (data) => {
          // Assert - Request succeeded after retry
          expect(data).toEqual(expectedData);
          expect(tokenMemoryService.getAccessToken()).toBe(newToken);
          done();
        },
        error: () => {
          fail('Request should have succeeded after refresh');
          done();
        },
      });

      // Assert - First request with old token fails with 401
      const firstReq = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(firstReq.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
      firstReq.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      // Assert - Interceptor calls refresh
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(refreshReq.request.method).toBe('POST');
      expect(refreshReq.request.withCredentials).toBe(true);
      refreshReq.flush({ accessToken: newToken });

      // Assert - Request retried with new token
      const retryReq = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(retryReq.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      retryReq.flush(expectedData);
    });

    it('should store new access token in TokenMemoryService after refresh', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe({
        next: () => {
          // Assert
          expect(tokenMemoryService.getAccessToken()).toBe(newToken);
          expect(tokenMemoryService.hasToken()).toBe(true);
          done();
        },
      });

      // First request fails
      const firstReq = httpMock.expectOne(`${apiUrl}/users/me`);
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Refresh succeeds
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ accessToken: newToken });

      // Retry succeeds
      const retryReq = httpMock.expectOne(`${apiUrl}/users/me`);
      retryReq.flush({ id: 'user123' });
    });

    it('should not trigger refresh for /auth/login 401 errors', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.post(`${apiUrl}/auth/login`, { email: 'wrong@example.com', password: 'wrong' }).subscribe({
        error: (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(401);
          done();
        },
      });

      // Assert - Only login request, no refresh
      const loginReq = httpMock.expectOne(`${apiUrl}/auth/login`);
      loginReq.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      // No refresh request should be made
      httpMock.expectNone(`${apiUrl}/auth/refresh`);
    });

    it('should not trigger refresh for /auth/refresh 401 errors', (done) => {
      // Act
      httpClient.post(`${apiUrl}/auth/refresh`, {}).subscribe({
        error: (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(401);
          done();
        },
      });

      // Assert - Only refresh request, no additional refresh
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ message: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });

      // Assert - No additional refresh request should be made (httpMock.verify() will catch extras)
    });
  });

  describe('Single-Flight Token Refresh', () => {
    it('should trigger only one refresh when multiple requests fail with 401', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);
      let completedRequests = 0;
      const expectedResponses = 3;

      const handleComplete = () => {
        completedRequests++;
        if (completedRequests === expectedResponses) {
          done();
        }
      };

      // Act - Make 3 concurrent requests
      httpClient.get(`${apiUrl}/users/me`).subscribe({ next: handleComplete });
      httpClient.get(`${apiUrl}/users/profile`).subscribe({ next: handleComplete });
      httpClient.get(`${apiUrl}/users/settings`).subscribe({ next: handleComplete });

      // Assert - All 3 initial requests fail with 401
      const firstReq = httpMock.expectOne(`${apiUrl}/users/me`);
      const secondReq = httpMock.expectOne(`${apiUrl}/users/profile`);
      const thirdReq = httpMock.expectOne(`${apiUrl}/users/settings`);

      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });
      secondReq.flush(null, { status: 401, statusText: 'Unauthorized' });
      thirdReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Assert - Only ONE refresh request (single-flight)
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ accessToken: newToken });

      // Assert - All 3 requests are retried with new token
      const retryReq1 = httpMock.expectOne(`${apiUrl}/users/me`);
      const retryReq2 = httpMock.expectOne(`${apiUrl}/users/profile`);
      const retryReq3 = httpMock.expectOne(`${apiUrl}/users/settings`);

      expect(retryReq1.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      expect(retryReq2.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      expect(retryReq3.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);

      retryReq1.flush({ id: 'user123' });
      retryReq2.flush({ profile: 'data' });
      retryReq3.flush({ settings: 'data' });
    });
  });

  describe('Refresh Failure Handling', () => {
    it('should clear token and dispatch logout action when refresh fails', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe({
        error: (error: { statusCode: number }) => {
          // Assert
          expect(error.statusCode).toBe(401);
          expect(tokenMemoryService.getAccessToken()).toBeNull();
          expect(tokenMemoryService.hasToken()).toBe(false);
          expect(store.dispatch).toHaveBeenCalledWith(authSessionExpired());
          done();
        },
      });

      // First request fails with 401
      const firstReq = httpMock.expectOne(`${apiUrl}/users/me`);
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Refresh fails with 401 (refresh token expired)
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ message: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });

      // No retry should happen
    });

    it('should clear token when refresh fails with 403', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe({
        error: (error: { statusCode: number }) => {
          // Assert
          expect(error.statusCode).toBe(403);
          expect(tokenMemoryService.getAccessToken()).toBeNull();
          expect(store.dispatch).toHaveBeenCalledWith(authSessionExpired());
          done();
        },
      });

      // First request fails
      const firstReq = httpMock.expectOne(`${apiUrl}/users/me`);
      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Refresh fails with 403
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ message: 'Token revoked' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should fail all queued requests when refresh fails', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);
      let errors = 0;

      const handleError = () => {
        errors++;
        if (errors === 2) {
          expect(tokenMemoryService.getAccessToken()).toBeNull();
          done();
        }
      };

      // Act - Two concurrent requests
      httpClient.get(`${apiUrl}/users/me`).subscribe({ error: handleError });
      httpClient.get(`${apiUrl}/users/profile`).subscribe({ error: handleError });

      // Both fail with 401
      const firstReq = httpMock.expectOne(`${apiUrl}/users/me`);
      const secondReq = httpMock.expectOne(`${apiUrl}/users/profile`);

      firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });
      secondReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Refresh fails
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Non-401 Errors', () => {
    it('should not intercept 403 errors', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.get(`${apiUrl}/admin/users`).subscribe({
        error: (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(403);
          expect(tokenMemoryService.getAccessToken()).toBe(testToken); // Token not cleared
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      // Assert - No refresh should happen
      httpMock.expectNone(`${apiUrl}/auth/refresh`);
    });

    it('should not intercept 500 errors', (done) => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act
      httpClient.get(`${apiUrl}/users/me`).subscribe({
        error: (error: HttpErrorResponse) => {
          // Assert
          expect(error.status).toBe(500);
          expect(tokenMemoryService.getAccessToken()).toBe(testToken);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      // No refresh should happen
      httpMock.expectNone(`${apiUrl}/auth/refresh`);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete authentication flow', (done) => {
      // 1. User makes request with expired token
      tokenMemoryService.setAccessToken(testToken);

      httpClient.get(`${apiUrl}/users/me`).subscribe({
        next: (data) => {
          // 5. Request succeeds with new token
          expect(data).toEqual({ id: 'user123' });
          expect(tokenMemoryService.getAccessToken()).toBe(newToken);
          done();
        },
      });

      // 2. Request fails with 401
      const req1 = httpMock.expectOne(`${apiUrl}/users/me`);
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      // 3. Token refresh succeeds
      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ accessToken: newToken });

      // 4. Request retried automatically
      const req2 = httpMock.expectOne(`${apiUrl}/users/me`);
      req2.flush({ id: 'user123' });
    });

    it('should handle case-insensitive URL matching for auth endpoints', () => {
      // Arrange
      tokenMemoryService.setAccessToken(testToken);

      // Act - Various case combinations
      httpClient.post(`${apiUrl}/AUTH/LOGIN`, {}).subscribe();
      httpClient.post(`${apiUrl}/Auth/Refresh`, {}).subscribe();
      httpClient.post(`${apiUrl}/auth/LOGIN`, {}).subscribe();

      // Assert - No Authorization headers
      const req1 = httpMock.expectOne(`${apiUrl}/AUTH/LOGIN`);
      const req2 = httpMock.expectOne(`${apiUrl}/Auth/Refresh`);
      const req3 = httpMock.expectOne(`${apiUrl}/auth/LOGIN`);

      expect(req1.request.headers.has('Authorization')).toBe(false);
      expect(req2.request.headers.has('Authorization')).toBe(false);
      expect(req3.request.headers.has('Authorization')).toBe(false);

      req1.flush({});
      req2.flush({});
      req3.flush({});
    });
  });
});
