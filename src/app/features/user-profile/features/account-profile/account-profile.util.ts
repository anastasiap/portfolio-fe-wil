import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const normalizedRequiredValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  return normalizeName(String(control.value ?? '')).length > 0 ? null : { required: true };
};

export const normalizedMinLengthValidator = (minLength: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const actualLength = normalizeName(String(control.value ?? '')).length;
    return actualLength >= minLength ? null : { minlength: { requiredLength: minLength, actualLength } };
  };
};

export const normalizedMaxLengthValidator = (maxLength: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const actualLength = normalizeName(String(control.value ?? '')).length;
    return actualLength <= maxLength ? null : { maxlength: { requiredLength: maxLength, actualLength } };
  };
};
