import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthModalLauncherService } from './auth-modal-launcher.service';
import { AuthModalComponent } from '../../features/auth-modal/auth-modal.component';
import { AuthModalView } from '../../features/auth-modal/auth-modal.types';

describe('AuthModalLauncherService', () => {
  let service: AuthModalLauncherService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AuthModalComponent>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    mockDialogRef.afterClosed.and.returnValue(of(null));
    mockDialog.open.and.returnValue(mockDialogRef);

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [AuthModalLauncherService, { provide: MatDialog, useValue: mockDialog }],
    });

    service = TestBed.inject(AuthModalLauncherService);
  });

  afterEach(() => {
    mockDialog.open.calls.reset();
    mockDialogRef.afterClosed.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openAuthModal', () => {
    it('should open auth modal with correct configuration', () => {
      // Arrange
      const initialView: AuthModalView = 'login';

      // Act
      const result = service.openAuthModal(initialView);

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(AuthModalComponent, {
        data: { initialView: 'login' },
        width: '480px',
        maxWidth: '90vw',
        autoFocus: false,
        disableClose: false,
        hasBackdrop: true,
        backdropClass: 'auth-modal-backdrop',
        panelClass: 'auth-modal-panel',
      });
      expect(result).toBe(mockDialogRef);
    });

    it('should open auth modal with register view', () => {
      // Arrange
      const initialView: AuthModalView = 'register';

      // Act
      service.openAuthModal(initialView);

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        AuthModalComponent,
        jasmine.objectContaining({
          data: { initialView: 'register' },
        })
      );
    });

    it('should open auth modal with forgot password view', () => {
      // Arrange
      const initialView: AuthModalView = 'forgotPassword';

      // Act
      service.openAuthModal(initialView);

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        AuthModalComponent,
        jasmine.objectContaining({
          data: { initialView: 'forgotPassword' },
        })
      );
    });
  });

  describe('openForgotPasswordModal', () => {
    it('should open modal with forgotPassword view', () => {
      // Act
      const result = service.openForgotPasswordModal();

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        AuthModalComponent,
        jasmine.objectContaining({
          data: { initialView: 'forgotPassword' },
        })
      );
      expect(result).toBe(mockDialogRef);
    });
  });

  describe('openLoginModal', () => {
    it('should open modal with login view', () => {
      // Act
      const result = service.openLoginModal();

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        AuthModalComponent,
        jasmine.objectContaining({
          data: { initialView: 'login' },
        })
      );
      expect(result).toBe(mockDialogRef);
    });
  });

  describe('openRegisterModal', () => {
    it('should open modal with register view', () => {
      // Act
      const result = service.openRegisterModal();

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(
        AuthModalComponent,
        jasmine.objectContaining({
          data: { initialView: 'register' },
        })
      );
      expect(result).toBe(mockDialogRef);
    });
  });

  describe('Modal Configuration', () => {
    it('should use consistent configuration across all modal methods', () => {
      // Arrange
      const expectedBaseConfig = {
        width: '480px',
        maxWidth: '90vw',
        autoFocus: false,
        disableClose: false,
        hasBackdrop: true,
        backdropClass: 'auth-modal-backdrop',
        panelClass: 'auth-modal-panel',
      };

      // Act
      service.openLoginModal();
      service.openRegisterModal();
      service.openForgotPasswordModal();

      // Assert
      expect(mockDialog.open).toHaveBeenCalledTimes(3);

      const calls = mockDialog.open.calls.all();
      calls.forEach((call) => {
        const config = call.args[1];
        expect(config).toEqual(jasmine.objectContaining(expectedBaseConfig));
      });
    });

    it('should pass correct component to dialog', () => {
      // Act
      service.openAuthModal('login');

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(AuthModalComponent, jasmine.any(Object));
    });
  });

  describe('Dialog Reference Handling', () => {
    it('should return the dialog reference from MatDialog.open', () => {
      // Act
      const result = service.openAuthModal('login');

      // Assert
      expect(result).toBe(mockDialogRef);
    });

    it('should allow chaining afterClosed observable', () => {
      // Arrange
      const mockResult = { success: true };
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      // Act
      const dialogRef = service.openForgotPasswordModal();
      let receivedResult: unknown;
      dialogRef.afterClosed().subscribe((result) => {
        receivedResult = result;
      });

      // Assert
      expect(receivedResult).toEqual(mockResult);
    });
  });
});
