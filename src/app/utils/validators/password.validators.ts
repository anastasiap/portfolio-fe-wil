import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

interface PasswordStrengthResult {
  score: number; // 0-5 (0 = very weak, 5 = very strong)
  feedback: string[];
  isValid: boolean;
}

// Common weak passwords that should be rejected
const COMMON_PASSWORDS = [
  'password',
  '123456',
  'password123',
  'admin',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'abc123',
  'password1',
  'administrator',
  'root',
  'user',
  'guest',
  'test',
  'demo',
  'changeme',
  'temp',
  'temporary',
];

// Common patterns that should be rejected
const COMMON_PATTERNS = [
  /^(.)\1+$/, // All same character (aaaaaa)
  /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // Sequential letters
  /^(qwe|asd|zxc)+/i, // Keyboard patterns
];

/**
 * Comprehensive password validator
 * Enforces enterprise-grade password requirements
 */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || typeof value !== 'string') {
      return null; // Let required validator handle empty values
    }

    const errors: ValidationErrors = {};

    if (value.length < 12) {
      errors['minLength'] = { required: 12, actual: value.length };
    }

    if (value.length > 128) {
      errors['maxLength'] = { required: 128, actual: value.length };
    }

    // Must contain lowercase letter
    if (!/[a-z]/.test(value)) {
      errors['missingLowercase'] = true;
    }

    // Must contain uppercase letter
    if (!/[A-Z]/.test(value)) {
      errors['missingUppercase'] = true;
    }

    // Must contain number
    if (!/[0-9]/.test(value)) {
      errors['missingNumber'] = true;
    }

    // Must contain special character
    if (!/[^a-zA-Z0-9]/.test(value)) {
      errors['missingSpecialChar'] = true;
    }

    // Check against common passwords
    if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
      errors['commonPassword'] = true;
    }

    // Check against common patterns
    if (COMMON_PATTERNS.some((pattern) => pattern.test(value))) {
      errors['commonPattern'] = true;
    }

    // Check for repeated characters (more than 3 in a row)
    if (/(.)\1{3,}/.test(value)) {
      errors['repeatedChars'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Medium strength password validator for less strict requirements
 * Suitable for user-facing applications with good UX balance
 */
export function mediumPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || typeof value !== 'string') {
      return null;
    }

    const errors: ValidationErrors = {};

    // Minimum length (8 characters)
    if (value.length < 8) {
      errors['minLength'] = { required: 8, actual: value.length };
    }

    // Check against most common passwords
    const topCommonPasswords = ['password', '123456', '12345678', '123456789', 'password123', 'admin', 'qwerty'];
    if (topCommonPasswords.includes(value.toLowerCase())) {
      errors['commonPassword'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Password confirmation validator
 * Ensures password and confirmation fields match
 */
export function passwordMatchValidator(passwordField: string, confirmPasswordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField)?.value;
    const confirmPassword = control.get(confirmPasswordField)?.value;

    if (!password || !confirmPassword) {
      return null; // Don't validate if either field is empty
    }

    if (password !== confirmPassword) {
      // Set error on the confirmation field specifically
      const confirmControl = control.get(confirmPasswordField);
      if (confirmControl) {
        confirmControl.setErrors({ passwordMismatch: true });
      }
      return { passwordMismatch: true };
    } else {
      // Clear the error if passwords match
      const confirmControl = control.get(confirmPasswordField);
      if (confirmControl && confirmControl.errors?.['passwordMismatch']) {
        delete confirmControl.errors['passwordMismatch'];
        if (Object.keys(confirmControl.errors).length === 0) {
          confirmControl.setErrors(null);
        }
      }
    }

    return null;
  };
}

/**
 * Calculates password strength and provides feedback
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, feedback: ['Password is required'], isValid: false };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    feedback.push('Use at least 12 characters for better security');
  } else {
    feedback.push('Password too short (minimum 8 characters)');
  }

  // Character variety scoring
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const charTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  score += charTypes;

  if (!hasLower) feedback.push('Add lowercase letters');
  if (!hasUpper) feedback.push('Add uppercase letters');
  if (!hasNumber) feedback.push('Add numbers');
  if (!hasSpecial) feedback.push('Add special characters (!@#$%^&*)');

  // Penalty for common patterns
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  if (COMMON_PATTERNS.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid predictable patterns');
  }

  // Bonus for length
  if (password.length >= 16) score += 1;

  // Cap the score
  score = Math.min(5, score);

  const isValid = score >= 4 && charTypes >= 3;

  if (feedback.length === 0) {
    feedback.push('Strong password!');
  }

  return { score, feedback, isValid };
}

/**
 * Get user-friendly error messages for password validation errors
 */
export function getPasswordErrorMessage(errors: ValidationErrors): string {
  if (errors['required']) {
    return 'Password is required';
  }

  if (errors['minLength']) {
    const required = errors['minLength'].required;
    return `Password must be at least ${required} characters long`;
  }

  if (errors['maxLength']) {
    const required = errors['maxLength'].required;
    return `Password must not exceed ${required} characters`;
  }

  if (errors['missingLowercase']) {
    return 'Password must contain at least one lowercase letter';
  }

  if (errors['missingUppercase']) {
    return 'Password must contain at least one uppercase letter';
  }

  if (errors['missingNumber']) {
    return 'Password must contain at least one number';
  }

  if (errors['missingSpecialChar']) {
    return 'Password must contain at least one special character';
  }

  if (errors['commonPassword']) {
    return 'This password is too common. Please choose a different one';
  }

  if (errors['commonPattern']) {
    return 'Avoid predictable patterns like "123" or "abc"';
  }

  if (errors['repeatedChars']) {
    return 'Avoid repeating the same character more than 3 times';
  }

  if (errors['insufficientComplexity']) {
    const required = errors['insufficientComplexity'].required;
    return `Password must contain at least ${required} different character types`;
  }

  if (errors['passwordMismatch']) {
    return 'Passwords do not match';
  }

  return 'Password does not meet requirements';
}

/**
 * Validates that new password is different from current password
 * Use in password change forms
 */
export function differentFromCurrentPasswordValidator(currentPasswordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const currentPassword = control.parent?.get(currentPasswordField)?.value;
    const newPassword = control.value;

    if (!currentPassword || !newPassword) {
      return null;
    }

    if (currentPassword === newPassword) {
      return { sameAsCurrentPassword: true };
    }

    return null;
  };
}
