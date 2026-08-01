import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  public submitSupportRequest(request: SupportRequest): Observable<SupportRequestResponse> {
    const formData = new FormData();

    // Add form fields
    formData.append('name', request.name);
    formData.append('description', request.description);
    formData.append('metadata', JSON.stringify(request.metadata));

    // Add attachment if provided
    if (request.attachment) {
      formData.append('attachment', request.attachment, request.attachment.name);
    }

    return this.http.post<SupportRequestResponse>(`${this.apiUrl}/support/contact`, formData);
  }

  public submitFeatureRequest(request: FeatureRequestDto): Observable<SupportRequestResponse> {
    return this.http.post<SupportRequestResponse>(`${this.apiUrl}/support/feature-request`, request);
  }

  public submitWhiteLabelRequest(request: InquiryDto): Observable<SupportRequestResponse> {
    return this.http.post<SupportRequestResponse>(`${this.apiUrl}/support/inquiry`, request);
  }

  public validateAttachment(file: File): { valid: boolean; error?: string } {
    // Allowed file types for support attachments
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
    ];

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not supported. Please use images, PDFs, or text files.`,
      };
    }

    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds the 10MB limit.`,
      };
    }

    return { valid: true };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
