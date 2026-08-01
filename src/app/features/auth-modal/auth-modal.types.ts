/**
 * Authentication modal view types
 */
export type AuthModalView = 'login' | 'register' | 'forgotPassword';

/**
 * Data passed to the auth modal dialog
 */
export interface AuthModalData {
  /**
   * Initial view to display when the modal opens
   */
  readonly initialView: AuthModalView;
  readonly feature?: 'lock';
}
