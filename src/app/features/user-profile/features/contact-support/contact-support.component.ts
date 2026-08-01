import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { SupportService } from '../../../../services/api/support.service';

import { selectAccountId } from '../../../../state/auth/auth.selectors';
import { selectActiveWheel } from '../../../../state';
import { submitSupportRequest, submitSupportRequestFailure, submitSupportRequestSuccess } from '../../../../state/actions';
import { environment } from '../../../../../environments/environment';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { MetadataCollectorService } from '../../../../services/metadata-collector.service';

interface SupportForm {
  name: FormControl<string>;
  description: FormControl<string>;
  attachment: FormControl<File | null>;
}

@Component({
  selector: 'wil-contact-support',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CtaButtonComponent,
  ],
  templateUrl: './contact-support.component.html',
  styleUrl: './contact-support.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSupportComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actions$ = inject(Actions);
  private readonly supportService = inject(SupportService);
  private readonly metadataCollector = inject(MetadataCollectorService);

  private readonly accountId = toSignal(this.store.select(selectAccountId), { initialValue: null });
  private readonly activeWheel = toSignal(this.store.select(selectActiveWheel), { initialValue: null });

  private readonly supportRequestMetadata = computed(() =>
    this.metadataCollector.collectMetadata(
      this.accountId() || null,
      environment.production ? 'production' : 'development',
      this.router.url,
      this.activeWheel()?.id || null
    )
  );

  // Form
  public readonly supportForm = new FormGroup<SupportForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
    attachment: new FormControl<File | null>(null),
  });
  private readonly formValue = toSignal(this.supportForm.valueChanges, { initialValue: this.supportForm.getRawValue() });

  // UI State
  public readonly isSubmitting = signal(false);
  public readonly fileError = signal<string | null>(null);
  public readonly showSuccess = signal<boolean>(false);
  public readonly showError = signal<boolean>(false);
  public readonly selectedFile = computed(() => {
    this.formValue();
    return this.supportForm.controls.attachment.value;
  });
  public readonly selectedFileName = computed(() => this.selectedFile()?.name ?? null);
  public readonly isFormValid = computed(() => {
    this.formValue();
    return this.supportForm.valid && !this.fileError() && !this.isSubmitting();
  });

  // Constants
  public readonly supportEmail = 'test@example.com';

  constructor() {
    effect(() => {
      if (this.isSubmitting()) {
        this.supportForm.disable({ emitEvent: false });
        return;
      }

      this.supportForm.enable({ emitEvent: false });
    });
  }

  public ngOnInit(): void {
    // Clear any previous form state
    this.resetForm();

    // Listen for successful submission to reset form
    this.actions$.pipe(ofType(submitSupportRequestSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetForm();
      this.isSubmitting.set(false);
      this.showSuccess.set(true);
      this.showError.set(false);
    });

    // Listen for failed submission to reset loading state
    this.actions$.pipe(ofType(submitSupportRequestFailure), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isSubmitting.set(false);
      this.showSuccess.set(false);
      this.showError.set(true);
    });
  }

  public onFileSelected(event: Event): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showSuccess.set(false);
    this.showError.set(false);

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processSelectedFile(input.files[0]);
    }
  }

  public onFileRemove(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.fileError.set(null);
    this.showSuccess.set(false);
    this.showError.set(false);

    this.supportForm.patchValue({
      attachment: null,
    });
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isSubmitting()) {
      return;
    }

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processSelectedFile(event.dataTransfer.files[0]);
    }
  }

  public onSubmit(): void {
    if (this.supportForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formValue = this.supportForm.getRawValue();

      const supportRequest: SupportRequest = {
        name: formValue.name,
        description: formValue.description,
        attachment: formValue.attachment || undefined,
        metadata: this.supportRequestMetadata(),
      };

      // Dispatch the action to trigger the effect
      this.store.dispatch(submitSupportRequest({ request: supportRequest }));
    }
  }

  private processSelectedFile(file: File): void {
    this.fileError.set(null);

    const validation = this.supportService.validateAttachment(file);

    if (!validation.valid) {
      this.fileError.set(validation.error || 'Invalid file');
      this.supportForm.patchValue({
        attachment: null,
      });
      return;
    }

    this.supportForm.patchValue({
      attachment: file,
    });
  }

  private resetForm(): void {
    this.supportForm.reset();
    this.fileError.set(null);
    this.supportForm.patchValue({
      name: '',
      description: '',
      attachment: null,
    });
    this.supportForm.markAsPristine();
  }
}
