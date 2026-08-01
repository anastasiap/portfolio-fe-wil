import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AccountsDataService } from './accounts-data.service';
import { AccountEmailPreferences, AccountLegalConsentsDto, AccountLegalConsentsRequest, AuthError } from '../auth/auth.types';
import { environment } from '../../../environments/environment';

describe('AccountsDataService', () => {
  let service: AccountsDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccountsDataService],
    });

    service = TestBed.inject(AccountsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('acceptLegalConsents', () => {
    const mockRequest: AccountLegalConsentsRequest = {
      termsAccepted: true,
      privacyAccepted: true,
      termsVersion: '2026-02-15',
      privacyVersion: '2026-02-15',
    };

    const mockResponse: AccountLegalConsentsDto = {
      termsAccepted: true,
      privacyAccepted: true,
      termsVersion: '2026-02-15',
      privacyVersion: '2026-02-15',
      acceptedAt: new Date('2026-02-16T00:00:00Z'),
    };

    it('should send PATCH request to correct endpoint with credentials', () => {
      // Arrange & Act
      service.acceptLegalConsents(mockRequest).subscribe((response) => {
        // Assert
        expect(response).toEqual(mockResponse);
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/legal-consents`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(mockRequest);
      expect(req.request.withCredentials).toBeTrue();

      // Respond with mock data
      req.flush(mockResponse);
    });

    it('should handle 400 error response', () => {
      // Arrange
      const errorResponse = { status: 400, statusText: 'Bad Request' };
      let capturedError: AuthError | undefined = undefined;

      // Act
      service.acceptLegalConsents(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error: AuthError) => {
          capturedError = error;
        },
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/legal-consents`);
      req.flush(null, errorResponse);

      // Assert error handling
      expect(capturedError).toBeTruthy();
      expect((capturedError as unknown as AuthError).statusCode).toBe(400);
      expect((capturedError as unknown as AuthError)?.code).toBe('INVALID_DATA');
      expect((capturedError as unknown as AuthError)?.message).toBe('Invalid preferences data. Please check your input and try again.');
    });

    it('should handle 401 error response', () => {
      // Arrange
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      let capturedError: AuthError | undefined = undefined;

      // Act
      service.acceptLegalConsents(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error: AuthError) => {
          capturedError = error;
        },
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/legal-consents`);
      req.flush(null, errorResponse);

      // Assert error handling
      expect(capturedError).toBeTruthy();
      expect((capturedError as unknown as AuthError)?.statusCode).toBe(401);
      expect((capturedError as unknown as AuthError)?.code).toBe('UNAUTHORIZED');
      expect((capturedError as unknown as AuthError)?.message).toBe('You are not authorized to access this resource. Please log in.');
    });

    it('should handle 500 error response', () => {
      // Arrange
      const errorResponse = { status: 500, statusText: 'Internal Server Error' };
      let capturedError: AuthError | undefined = undefined;

      // Act
      service.acceptLegalConsents(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error: AuthError) => {
          capturedError = error;
        },
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/legal-consents`);
      req.flush(null, errorResponse);

      // Assert error handling
      expect(capturedError).toBeTruthy();
      expect((capturedError as unknown as AuthError)?.statusCode).toBe(500);
      expect((capturedError as unknown as AuthError)?.code).toBe('SERVER_ERROR');
      expect((capturedError as unknown as AuthError)?.message).toBe('Server error. Please try again later.');
    });

    it('should handle network error', () => {
      // Arrange
      let capturedError: AuthError | undefined = undefined;

      // Act
      service.acceptLegalConsents(mockRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error: AuthError) => {
          capturedError = error;
        },
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/legal-consents`);
      req.error(new ErrorEvent('Network error'));

      // Assert error handling
      expect(capturedError).toBeTruthy();
      expect((capturedError as unknown as AuthError)?.statusCode).toBe(0);
      expect((capturedError as unknown as AuthError)?.code).toBe('NETWORK_ERROR');
      expect((capturedError as unknown as AuthError)?.message).toBe(
        'A network error occurred. Please check your connection and try again.'
      );
    });
  });

  describe('updateMyEmailPreferences', () => {
    const mockRequest = {
      productUpdates: true,
      educationalContent: false,
      marketingContent: true,
    };

    const mockResponse: AccountEmailPreferences = {
      productUpdates: true,
      educationalContent: false,
      marketingContent: true,
    };

    it('should send PATCH request to correct endpoint with credentials', () => {
      // Arrange & Act
      service.updateMyEmailPreferences(mockRequest).subscribe((response) => {
        // Assert
        expect(response).toEqual(mockResponse);
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/accounts/preferences/email`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(mockRequest);
      expect(req.request.withCredentials).toBeTrue();

      // Respond with mock data
      req.flush(mockResponse);
    });
  });
});
