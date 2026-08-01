import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AuthModalComponent } from '../../features/auth-modal/auth-modal.component';
import { AuthModalData, AuthModalView } from '../../features/auth-modal/auth-modal.types';

/**
 * Service for launching auth modals with consistent configuration.
 * Provides a reusable way to open auth modals throughout the application.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthModalLauncherService {
  private readonly dialog = inject(MatDialog);

  /**
   * Open auth modal with specified initial view
   * @param initialView - The view to display when modal opens
   * @returns MatDialogRef for the opened modal
   */
  public openAuthModal(initialView: AuthModalView): MatDialogRef<AuthModalComponent> {
    const config: MatDialogConfig<AuthModalData> = {
      data: { initialView },
      width: '480px',
      maxWidth: '90vw',
      autoFocus: false, // Prevent weird focus jumps
      disableClose: false, // Allow ESC and backdrop click
      hasBackdrop: true,
      backdropClass: 'auth-modal-backdrop',
      panelClass: 'auth-modal-panel',
    };

    return this.dialog.open(AuthModalComponent, config);
  }

  /**
   * Open forgot password modal directly
   * @returns MatDialogRef for the opened modal
   */
  public openForgotPasswordModal(): MatDialogRef<AuthModalComponent> {
    return this.openAuthModal('forgotPassword');
  }

  /**
   * Open login modal directly
   * @returns MatDialogRef for the opened modal
   */
  public openLoginModal(): MatDialogRef<AuthModalComponent> {
    return this.openAuthModal('login');
  }

  /**
   * Open register modal directly
   * @returns MatDialogRef for the opened modal
   */
  public openRegisterModal(): MatDialogRef<AuthModalComponent> {
    return this.openAuthModal('register');
  }
}
