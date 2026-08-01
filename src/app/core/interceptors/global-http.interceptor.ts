import * as Sentry from '@sentry/angular';
import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { NotificationService } from '../../services/notification.service';
import { AppError } from '../errors/app-error.model';
import { DEFAULT_ERROR_MESSAGE, ERROR_MESSAGE_MAP } from '../errors/error-message-map';
import { isGlobalError } from '../errors/global-error-rules';
import { LogService } from '../services/log.service';

interface BackendErrorBody {
  code?: string;
  message?: string;
  traceId?: string;
}

function isBackendErrorBody(value: unknown): value is BackendErrorBody {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class GlobalHttpInterceptor implements HttpInterceptor {
  private readonly notification = inject(NotificationService);
  private readonly logService = inject(LogService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const appError = this.normalizeError(error, req);

        this.logHttpError(appError);

        if (isGlobalError(appError.status, appError.code)) {
          this.handleGlobalError(appError);
        }

        return throwError(() => appError);
      })
    );
  }

  private normalizeError(error: HttpErrorResponse, req: HttpRequest<unknown>): AppError {
    if (error.status === 0) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGE_MAP['NETWORK_ERROR'],
        devMessage: error.message,
        url: req.url,
        method: req.method,
        timestamp: Date.now(),
      };
    }

    const backendError = isBackendErrorBody(error.error) ? error.error : undefined;

    const code = backendError?.code ?? `HTTP_${error.status}`;

    const userMessage = ERROR_MESSAGE_MAP[code] || DEFAULT_ERROR_MESSAGE;

    return {
      status: error.status,
      code,
      message: userMessage,
      devMessage: backendError?.message ?? error.message,
      traceId: backendError?.traceId,
      url: req.url,
      method: req.method,
      timestamp: Date.now(),
    };
  }

  private handleGlobalError(error: AppError): void {
    if (error.devMessage !== 'Refresh token is required') {
      this.notification.showGlobalError(error.message);
    }
  }

  private logHttpError(error: AppError): void {
    this.logService.error({
      type: 'http_error',
      status: error.status,
      code: error.code,
      traceId: error.traceId,
      url: error.url,
      method: error.method,
      devMessage: error.devMessage,
      timestamp: error.timestamp,
    });

    // Also send to Sentry for critical errors
    if (error.status >= 500 || error.code === 'NETWORK_ERROR') {
      Sentry.captureException(new Error(`HTTP ${error.status}: ${error.devMessage}`), {
        tags: {
          errorType: 'http_error',
          statusCode: error.status,
          errorCode: error.code,
        },
        extra: {
          url: error.url,
          method: error.method,
          traceId: error.traceId,
        },
      });
    }
  }
}
