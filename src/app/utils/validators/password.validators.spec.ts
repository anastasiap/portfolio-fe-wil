import { FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import {
  calculatePasswordStrength,
  differentFromCurrentPasswordValidator,
  mediumPasswordValidator,
  strongPasswordValidator,
} from './password.validators';

describe('strongPasswordValidator', () => {
  let validator: ValidatorFn;

  beforeEach(() => {
    validator = strongPasswordValidator();
  });

  it('should return null for strong passwords', () => {
    const strongPasswords = ['ValidPass123!', 'Another$Secure9', 'LongerPassword#2026'];

    strongPasswords.forEach((password) => {
      const result = validator(new FormControl(password));

      expect(result).toBeNull();
    });
  });

  it('should return null for empty and non-string values', () => {
    const ignoredValues = ['', null, undefined, 123, true, {}, []];

    ignoredValues.forEach((value) => {
      const result = validator(new FormControl(value));

      expect(result).toBeNull();
    });
  });

  it('should accept passwords at the 12 character minimum boundary', () => {
    const result = validator(new FormControl('ValidPass1!2'));

    expect(result).toBeNull();
  });

  it('should reject passwords shorter than 12 characters', () => {
    const result = validator(new FormControl('Short1!Aa'));

    expect(result?.['minLength']).toEqual({ required: 12, actual: 9 });
  });

  it('should accept passwords at the 128 character maximum boundary', () => {
    const password = `A1!${'abc'.repeat(41)}ab`;
    const result = validator(new FormControl(password));

    expect(result).toBeNull();
  });

  it('should reject passwords longer than 128 characters', () => {
    const password = `A1!${'abc'.repeat(42)}`;
    const result = validator(new FormControl(password));

    expect(result?.['maxLength']).toEqual({ required: 128, actual: 129 });
  });

  it('should reject passwords missing required character types', () => {
    const cases = [
      { password: 'UPPERCASE123!', error: 'missingLowercase' },
      { password: 'lowercase123!', error: 'missingUppercase' },
      { password: 'NoNumbersHere!', error: 'missingNumber' },
      { password: 'NoSpecial1234', error: 'missingSpecialChar' },
    ];

    cases.forEach(({ password, error }) => {
      const result = validator(new FormControl(password));

      expect(result?.[error]).toBeTrue();
    });
  });

  it('should reject common passwords case-insensitively', () => {
    const result = validator(new FormControl('Password123'));

    expect(result?.['commonPassword']).toBeTrue();
  });

  it('should reject predictable common patterns', () => {
    const result = validator(new FormControl('abcABC123!xyz'));

    expect(result?.['commonPattern']).toBeTrue();
  });

  it('should reject passwords with more than 3 repeated characters in a row', () => {
    const result = validator(new FormControl('ValidPass1111!'));

    expect(result?.['repeatedChars']).toBeTrue();
  });
});

describe('mediumPasswordValidator', () => {
  let validator: ValidatorFn;

  beforeEach(() => {
    validator = mediumPasswordValidator();
  });

  it('should return null for valid medium passwords', () => {
    const validPasswords = ['validpass', 'Valid123', 'any text', 'LongerPasswordWithoutComplexity'];

    validPasswords.forEach((password) => {
      const result = validator(new FormControl(password));

      expect(result).toBeNull();
    });
  });

  it('should return null for empty and non-string values', () => {
    const ignoredValues = ['', null, undefined, 123, true, {}, []];

    ignoredValues.forEach((value) => {
      const result = validator(new FormControl(value));

      expect(result).toBeNull();
    });
  });

  it('should accept passwords at the 8 character minimum boundary', () => {
    const result = validator(new FormControl('1234567a'));

    expect(result).toBeNull();
  });

  it('should reject passwords shorter than 8 characters', () => {
    const result = validator(new FormControl('short7'));

    expect(result?.['minLength']).toEqual({ required: 8, actual: 6 });
  });

  it('should reject top common passwords', () => {
    const commonPasswords = ['password', '123456', '12345678', '123456789', 'password123', 'admin', 'qwerty'];

    commonPasswords.forEach((password) => {
      const result = validator(new FormControl(password));

      expect(result?.['commonPassword']).toBeTrue();
    });
  });

  it('should reject common passwords case-insensitively', () => {
    const result = validator(new FormControl('Password123'));

    expect(result?.['commonPassword']).toBeTrue();
  });

  it('should return both length and common password errors when both rules fail', () => {
    const result = validator(new FormControl('admin'));

    expect(result?.['minLength']).toEqual({ required: 8, actual: 5 });
    expect(result?.['commonPassword']).toBeTrue();
  });
});

describe('calculatePasswordStrength', () => {
  it('should return a strong result for a valid complex password', () => {
    const result = calculatePasswordStrength('ValidPass123!');

    expect(result).toEqual({
      score: 5,
      feedback: ['Strong password!'],
      isValid: true,
    });
  });

  it('should cap the score at 5 for long complex passwords', () => {
    const result = calculatePasswordStrength('VeryStrongPassword123!');

    expect(result.score).toBe(5);
    expect(result.isValid).toBeTrue();
    expect(result.feedback).toEqual(['Strong password!']);
  });

  it('should return required feedback for empty passwords', () => {
    const result = calculatePasswordStrength('');

    expect(result).toEqual({
      score: 0,
      feedback: ['Password is required'],
      isValid: false,
    });
  });

  it('should score 8 character passwords and recommend at least 12 characters', () => {
    const result = calculatePasswordStrength('Valid12!');

    expect(result.score).toBe(5);
    expect(result.isValid).toBeTrue();
    expect(result.feedback).toEqual(['Use at least 12 characters for better security']);
  });

  it('should report missing character types', () => {
    const result = calculatePasswordStrength('lowercaseonly');

    expect(result.score).toBe(3);
    expect(result.isValid).toBeFalse();
    expect(result.feedback).toEqual(['Add uppercase letters', 'Add numbers', 'Add special characters (!@#$%^&*)']);
  });

  it('should report short passwords', () => {
    const result = calculatePasswordStrength('passwrd');

    expect(result.score).toBe(1);
    expect(result.isValid).toBeFalse();
    expect(result.feedback).toEqual([
      'Password too short (minimum 8 characters)',
      'Add uppercase letters',
      'Add numbers',
      'Add special characters (!@#$%^&*)',
    ]);
  });

  it('should penalize common passwords', () => {
    const result = calculatePasswordStrength('password');

    expect(result.score).toBe(0);
    expect(result.isValid).toBeFalse();
    expect(result.feedback).toEqual([
      'Use at least 12 characters for better security',
      'Add uppercase letters',
      'Add numbers',
      'Add special characters (!@#$%^&*)',
      'Avoid common passwords',
    ]);
  });

  it('should penalize predictable patterns', () => {
    const result = calculatePasswordStrength('abcabcabc');

    expect(result.score).toBe(1);
    expect(result.isValid).toBeFalse();
    expect(result.feedback).toEqual([
      'Use at least 12 characters for better security',
      'Add uppercase letters',
      'Add numbers',
      'Add special characters (!@#$%^&*)',
      'Avoid predictable patterns',
    ]);
  });
});

describe('differentFromCurrentPasswordValidator', () => {
  let validator: ValidatorFn;

  beforeEach(() => {
    validator = differentFromCurrentPasswordValidator('currentPassword');
  });

  it('should return null when the new password differs from the current password', () => {
    const form = new FormGroup({
      currentPassword: new FormControl('CurrentPass123!'),
      newPassword: new FormControl('NewPass123!'),
    });

    const result = validator(form.get('newPassword') as FormControl);

    expect(result).toBeNull();
  });

  it('should return an error when the new password matches the current password', () => {
    const form = new FormGroup({
      currentPassword: new FormControl('SamePass123!'),
      newPassword: new FormControl('SamePass123!'),
    });

    const result = validator(form.get('newPassword') as FormControl);

    expect(result).toEqual({ sameAsCurrentPassword: true });
  });

  it('should return null when the current password is missing', () => {
    const form = new FormGroup({
      currentPassword: new FormControl(''),
      newPassword: new FormControl('NewPass123!'),
    });

    const result = validator(form.get('newPassword') as FormControl);

    expect(result).toBeNull();
  });

  it('should return null when the new password is missing', () => {
    const form = new FormGroup({
      currentPassword: new FormControl('CurrentPass123!'),
      newPassword: new FormControl(''),
    });

    const result = validator(form.get('newPassword') as FormControl);

    expect(result).toBeNull();
  });

  it('should return null when the current password field does not exist', () => {
    const form = new FormGroup({
      newPassword: new FormControl('NewPass123!'),
    });

    const result = validator(form.get('newPassword') as FormControl);

    expect(result).toBeNull();
  });

  it('should return null when the control has no parent form', () => {
    const result = validator(new FormControl('NewPass123!'));

    expect(result).toBeNull();
  });
});
