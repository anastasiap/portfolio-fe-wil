export const ERROR_MESSAGE_MAP: Record<string, string> = {
  NETWORK_ERROR: 'No internet connection. Check your network.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Requested resource was not found.',
  WHEEL_VERSION_CONFLICT: 'Data was changed elsewhere. Please refresh.',
  EMAIL_ALREADY_USED: 'This email is already in use.',
  SUBSCRIPTION_REQUIRED: 'This feature requires an active subscription.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  INTERNAL_SERVER_ERROR: 'Something went wrong on our side.',

  INVALID_OR_EXPIRED_RESET_PASSWORD_TOKEN: 'You reset link seems to be invalid. Please, try again later or request a new one.',

  EMAIL_VERIFICATION_TOKEN: 'Password reset link is invalid.',
  EMAIL_VERIFICATION_TOKEN_USED: 'Link is already used.',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'Link has expired.',
  EMAIL_VERIFICATION_INVALID_USER: 'Invalid or expired verification link.',
  EMAIL_VERIFICATION_INVALID_EMAIL: 'Invalid or expired verification link.',

  WHEEL_LIMIT_EXCEEDED: 'Maximum number of wheels (1) reached for this account',
  WHEEL_SESSIONS_LIMIT_EXCEEDED: 'Maximum number of sessions (5) reached for this account',
};

export const DEFAULT_ERROR_MESSAGE = 'Action could not be completed. Please try again.';
