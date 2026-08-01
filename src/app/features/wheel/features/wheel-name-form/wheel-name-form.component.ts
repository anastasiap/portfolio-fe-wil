import { Component, DestroyRef, EventEmitter, inject, input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { noNewWheelNameValidator } from 'src/app/features/personal/wheel-name.validators';

import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { setWheelNewName } from '../../../../state';

export const NEW_WHEEL_NAME = 'My New Wheel';

@Component({
  selector: 'wil-wheel-name-form',
  standalone: true,
  imports: [FormsModule, MatFormField, ReactiveFormsModule, MatError, MatFormField, MatInput, MatLabel, MatError, MatInput],
  templateUrl: './wheel-name-form.component.html',
  styleUrl: './wheel-name-form.component.scss',
})
export class WheelNameFormComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  @Output() public readonly nameChanged = new EventEmitter<{ name: string; hasError: boolean }>();

  public readonly wheelName = input<string | null>();

  public readonly wheelForm = this.fb.nonNullable.group({
    name: [NEW_WHEEL_NAME, [Validators.required, Validators.minLength(2), Validators.maxLength(100), noNewWheelNameValidator()]],
  });

  private nameFc = this.wheelForm.controls.name;

  ngOnInit(): void {
    const initialName = this.wheelName();

    if (initialName) {
      this.nameFc.patchValue(initialName, { emitEvent: false });
    }

    this.nameFc.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.store.dispatch(setWheelNewName({ name: value }));

      this.nameChanged.emit({ name: value, hasError: Boolean(this.nameFc.errors) });
    });

    this.nameFc.markAsTouched();
    this.nameFc.updateValueAndValidity({ emitEvent: true });
  }
}
