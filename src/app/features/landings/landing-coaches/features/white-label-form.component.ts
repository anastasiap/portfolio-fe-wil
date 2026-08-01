import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { setEmail } from '../../../../utils/set-email.util';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { submitInquiryFailure, submitInquiryRequest, submitInquirySuccess } from '../../../../state';

@Component({
  selector: 'wil-apply-form',
  standalone: true,
  templateUrl: './white-label-form.component.html',
  styleUrl: './white-label-form.component.scss',
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel, MatIcon, CtaButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhiteLabelFormComponent implements OnInit, AfterViewChecked {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<WhiteLabelFormComponent>);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  public readonly applied = output<void>();

  public form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    message: [''],
    nickname: [''], // honey pot field
  });
  public readonly submitted = signal(false);
  public readonly success = signal(false);

  ngOnInit(): void {
    this.actions$.pipe(ofType(submitInquirySuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.success.set(true);
      this.form.disable();
      this.applied.emit();
      this.submitted.set(false);
    });

    this.actions$.pipe(ofType(submitInquiryFailure), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.submitted.set(false);
    });
  }

  ngAfterViewChecked() {
    setEmail(this.platformId);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitted()) return;

    const formData = this.form.value;
    // Check honey pot field - if filled, it's likely a bot
    if (formData.nickname) {
      return;
    }

    this.submitted.set(true);

    const payload = {
      email: formData.email!,
      message: formData.message,
      nickname: formData.nickname,
      sentAt: new Date().toISOString(),
    };

    this.store.dispatch(submitInquiryRequest({ request: payload }));
  }

  close(): void {
    this.dialogRef.close();
  }
}
