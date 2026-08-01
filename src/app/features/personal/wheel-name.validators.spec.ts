import { FormControl } from '@angular/forms';
import { noGenericWheelNameValidator, noNewWheelNameValidator } from './wheel-name.validators';
import { NEW_WHEEL_NAME } from '../wheel/features/wheel-name-form/wheel-name-form.component';

describe('Wheel Name Validators', () => {
  describe('noNewWheelNameValidator', () => {
    let validator: jasmine.Func;

    beforeEach(() => {
      validator = noNewWheelNameValidator();
    });

    it('should return null for valid wheel names', () => {
      const validNames = [
        'Fitness Assessment',
        'Wellbeing Check',
        'Quarterly Review',
        'Life Balance Wheel',
        'Personal Growth',
        'Career Development',
      ];

      validNames.forEach((name) => {
        const control = new FormControl(name);
        const result = validator(control);
        expect(result).toBeNull();
      });
    });

    it('should return null for empty values', () => {
      const emptyValues = ['', null, undefined];

      emptyValues.forEach((value) => {
        const control = new FormControl(value);
        const result = validator(control);
        expect(result).toBeNull();
      });
    });

    it(`should return error for "${NEW_WHEEL_NAME}" (exact match)`, () => {
      const control = new FormControl(NEW_WHEEL_NAME);
      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result.noNewWheelName).toBeDefined();
      expect(result.noNewWheelName.message).toBe('Update your Wheel name with something unique and special for you');
      expect(result.noNewWheelName.actualValue).toBe(NEW_WHEEL_NAME);
    });

    it(`should return error for "${NEW_WHEEL_NAME}" case variations`, () => {
      const caseVariations = [NEW_WHEEL_NAME.toLowerCase(), NEW_WHEEL_NAME.toUpperCase(), 'My new wheel', 'mY nEw WhEeL'];

      caseVariations.forEach((variation) => {
        const control = new FormControl(variation);
        const result = validator(control);

        expect(result).not.toBeNull();
        expect(result.noNewWheelName).toBeDefined();
        expect(result.noNewWheelName.message).toBe('Update your Wheel name with something unique and special for you');
      });
    });

    it(`should return error for "${NEW_WHEEL_NAME}" with extra whitespace`, () => {
      const whitespaceVariations = [`  ${NEW_WHEEL_NAME}  `, `\t${NEW_WHEEL_NAME}\t`, `\n${NEW_WHEEL_NAME}\n`, ` ${NEW_WHEEL_NAME} `];

      whitespaceVariations.forEach((variation) => {
        const control = new FormControl(variation);
        const result = validator(control);

        expect(result).not.toBeNull();
        expect(result.noNewWheelName).toBeDefined();
        expect(result.noNewWheelName.message).toBe('Update your Wheel name with something unique and special for you');
      });
    });

    it(`should allow names that contain "${NEW_WHEEL_NAME}" but are not exactly "${NEW_WHEEL_NAME}"`, () => {
      const validVariations = [
        `${NEW_WHEEL_NAME} 2024`,
        `${NEW_WHEEL_NAME} for Fitness`,
        `Brand ${NEW_WHEEL_NAME}`,
        `${NEW_WHEEL_NAME}house`,
      ];

      validVariations.forEach((variation) => {
        const control = new FormControl(variation);
        const result = validator(control);
        expect(result).toBeNull();
      });
    });

    it('should handle non-string values', () => {
      const nonStringValues = [123, true, false, {}, []];

      nonStringValues.forEach((value) => {
        const control = new FormControl(value);
        const result = validator(control);
        // Should not throw an error and should return null for non-"New Wheel" values
        expect(result).toBeNull();
      });
    });
  });

  describe('noGenericWheelNameValidator', () => {
    let validator: jasmine.Func;

    beforeEach(() => {
      validator = noGenericWheelNameValidator();
    });

    it('should return null for specific wheel names', () => {
      const specificNames = ['Fitness Assessment', 'Wellbeing Check', 'Quarterly Review', 'Life Balance Wheel', 'Personal Growth Journey'];

      specificNames.forEach((name) => {
        const control = new FormControl(name);
        const result = validator(control);
        expect(result).toBeNull();
      });
    });

    it('should return error for all generic names', () => {
      const genericNames = ['New Wheel', 'Untitled Wheel', 'Wheel', 'New', 'Untitled'];

      genericNames.forEach((name) => {
        const control = new FormControl(name);
        const result = validator(control);

        expect(result).not.toBeNull();
        expect(result.noGenericWheelName).toBeDefined();
        expect(result.noGenericWheelName.message).toBe('Update your Wheel name');
        expect(result.noGenericWheelName.suggestedNames).toEqual([
          'Fitness Assessment',
          'Wellbeing Check',
          'Quarterly Review',
          'Life Balance',
        ]);
      });
    });

    it('should be case insensitive for generic names', () => {
      const caseVariations = ['NEW WHEEL', 'untitled wheel', 'WHEEL', 'nEw', 'UNTITLED'];

      caseVariations.forEach((variation) => {
        const control = new FormControl(variation);
        const result = validator(control);

        expect(result).not.toBeNull();
        expect(result.noGenericWheelName).toBeDefined();
      });
    });
  });
});
