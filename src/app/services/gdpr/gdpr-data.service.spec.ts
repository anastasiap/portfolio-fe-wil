import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GdprDataService } from './gdpr-data.service';
import { GdprExportResponse } from './gdpr.types';
import { environment } from '../../../environments/environment';

describe('GdprDataService', () => {
  let service: GdprDataService;
  let httpMock: HttpTestingController;

  const mockExportResponse: GdprExportResponse = {
    exportId: 'test-export-id',
    status: 'ready',
    expiresAt: '2026-02-17T10:00:00.000Z',
    downloadUrl: '/gdpr/exports/test-export-id/download',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GdprDataService],
    });

    service = TestBed.inject(GdprDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createExport', () => {
    it('should send POST request to create export', () => {
      // Arrange & Act
      service.createExport().subscribe((response) => {
        // Assert
        expect(response).toEqual(mockExportResponse);
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/gdpr/exports`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBe(true);

      // Respond with mock data
      req.flush(mockExportResponse);
    });

    it('should handle HTTP error response', () => {
      // Arrange
      const errorResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: 'Server error', code: 'SERVER_ERROR' },
      };

      // Act
      service.createExport().subscribe({
        next: () => fail('expected error'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          expect(error.message).toBe('Server error');
          expect(error.code).toBe('SERVER_ERROR');
        },
      });

      // Assert HTTP request and simulate error
      const req = httpMock.expectOne(`${environment.apiUrl}/gdpr/exports`);
      req.flush(errorResponse.error, errorResponse);
    });

    it('should map unknown errors correctly', () => {
      // Arrange
      const errorResponse = {
        status: 400,
        statusText: 'Bad Request',
        error: null,
      };

      // Act
      service.createExport().subscribe({
        next: () => fail('expected error'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(400);
          expect(error.message).toBe('An unexpected error occurred');
          expect(error.code).toBe('UNKNOWN_ERROR');
        },
      });

      // Assert HTTP request and simulate error
      const req = httpMock.expectOne(`${environment.apiUrl}/gdpr/exports`);
      req.flush(errorResponse.error, errorResponse);
    });
  });

  describe('deleteAccount', () => {
    it('should send DELETE request to delete account', () => {
      // Act
      service.deleteAccount().subscribe((response) => {
        // Assert - should complete successfully
        expect(response).toBeNull();
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/gdpr/me`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);

      // Respond with 204 No Content
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle HTTP error response for delete account', () => {
      // Arrange
      const errorResponse = {
        status: 403,
        statusText: 'Forbidden',
        error: { message: 'Account deletion not allowed', code: 'FORBIDDEN' },
      };

      // Act
      service.deleteAccount().subscribe({
        next: () => fail('expected error'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(403);
          expect(error.message).toBe('Account deletion not allowed');
          expect(error.code).toBe('FORBIDDEN');
        },
      });

      // Assert HTTP request and simulate error
      const req = httpMock.expectOne(`${environment.apiUrl}/gdpr/me`);
      req.flush(errorResponse.error, errorResponse);
    });
  });
});
