import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NEW_WHEEL_NAME } from '../wheel/features/wheel-name-form/wheel-name-form.component';

/**
 * Custom validator that checks if the wheel title equals "New Wheel"
 * @returns ValidatorFn that returns an error object if the title is "New Wheel"
 */
export function noNewWheelNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Don't validate empty values, let required validator handle that
    }

    // Check if the value equals "New Wheel" (case-insensitive)
    if (value.toString().toLowerCase().trim() === NEW_WHEEL_NAME.toLowerCase()) {
      return {
        noNewWheelName: {
          message: 'Update your Wheel name with something unique and special for you',
          actualValue: value,
        },
      };
    }

    return null; // Valid
  };
}

/**
 * Alternative validator that also checks for variations of "New Wheel"
 */
export function noGenericWheelNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const normalizedValue = value.toString().toLowerCase().trim();
    const genericNames = [NEW_WHEEL_NAME, 'new wheel', 'untitled wheel', 'wheel', 'new', 'untitled'];

    if (genericNames.includes(normalizedValue)) {
      return {
        noGenericWheelName: {
          message: 'Update your Wheel name',
          actualValue: value,
          suggestedNames: ['Fitness Assessment', 'Wellbeing Check', 'Quarterly Review', 'Life Balance'],
        },
      };
    }

    return null;
  };
}
