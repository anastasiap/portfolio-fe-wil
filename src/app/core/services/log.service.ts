import { Injectable } from '@angular/core';

type LogValue = string | number | boolean | null | undefined;

interface LogEntry {
  type: string;
  message?: string;
  status?: number;
  code?: string;
  traceId?: string;
  url?: string;
  method?: string;
  devMessage?: string;
  timestamp: number;
  [key: string]: LogValue;
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  public error(entry: LogEntry): void {
    try {
      // Remove sensitive data before logging
      const sanitizedEntry = this.sanitizeLogEntry(entry);

      // In development, log to console for debugging
      if (this.isDevelopment()) {
        console.error('[HTTP Error]', sanitizedEntry);
      }

      // In production, send to logging service
      // this.sendToLoggingService(sanitizedEntry);
    } catch (error) {
      // Never let logging errors break the application
      console.warn('LogService: Failed to log error', error);
    }
  }

  public info(entry: LogEntry): void {
    try {
      const sanitizedEntry = this.sanitizeLogEntry(entry);

      if (this.isDevelopment()) {
        console.info('[HTTP Info]', sanitizedEntry);
      }

      // this.sendToLoggingService(sanitizedEntry);
    } catch (error) {
      console.warn('LogService: Failed to log info', error);
    }
  }

  public warn(entry: LogEntry): void {
    try {
      const sanitizedEntry = this.sanitizeLogEntry(entry);

      if (this.isDevelopment()) {
        console.warn('[HTTP Warning]', sanitizedEntry);
      }

      // this.sendToLoggingService(sanitizedEntry);
    } catch (error) {
      console.warn('LogService: Failed to log warning', error);
    }
  }

  private sanitizeLogEntry(entry: LogEntry): LogEntry {
    // Create a copy to avoid mutating the original
    const sanitized = { ...entry };

    // Remove or mask sensitive data
    if (sanitized.url) {
      sanitized.url = this.sanitizeUrl(sanitized.url);
    }

    // Remove any potential password or token fields
    delete sanitized['password'];
    delete sanitized['token'];
    delete sanitized['authorization'];
    delete sanitized['accessToken'];

    return sanitized;
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'password', 'key', 'secret'];
      sensitiveParams.forEach((param) => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });

      return urlObj.toString();
    } catch {
      // If URL parsing fails, just return the original
      return url;
    }
  }

  private isDevelopment(): boolean {
    // Use Angular's environment or check if in development mode
    return typeof window !== 'undefined' && 'ng' in window;
  }

  // private sendToLoggingService(entry: LogEntry): void {
  //   // Send to external service like Sentry, LogRocket, etc.
  // }
}
