import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationComponent } from '../ui/custom-snackbar/notification.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  public showSuccess(message: string, duration = 3000): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration,
      data: {
        message,
        iconName: 'check_circle',
        icon: 'success-icon',
      },
      panelClass: ['success-snackbar'],
    });
  }

  public showError(message: string, duration = 5000): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration,
      data: {
        message,
        iconName: 'check_circle',
        icon: 'error-icon',
      },
      panelClass: ['error-snackbar'],
    });
  }

  public showInfo(message: string, duration = 4000): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration,
      data: {
        message,
        iconName: 'check_circle',
        icon: 'error-icon',
      },
      panelClass: ['info-snackbar'],
    });
  }

  // Convenience method for the GlobalHttpInterceptor
  public showGlobalError(message: string, duration = 10000): void {
    this.showError(message, duration);
  }
}
