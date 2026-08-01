import { createReducer, on } from '@ngrx/store';
import * as GdprActions from './gdpr.actions';
import { DeleteAccountState, GdprExportState, GdprState } from './gdpr.types';

const initialExportState: GdprExportState = {
  status: 'idle',
  exportId: undefined,
  expiresAt: undefined,
  downloadUrl: undefined,
  error: undefined,
  sasUrl: undefined,
};

const initialDeleteAccountState: DeleteAccountState = {
  status: 'idle',
  error: undefined,
};

const initialState: GdprState = {
  export: initialExportState,
  deleteAccount: initialDeleteAccountState,
};

export const gdprReducer = createReducer(
  initialState,
  on(GdprActions.gdprExportRequested, (state) => ({
    ...state,
    export: {
      ...state.export,
      status: 'loading' as const,
      error: undefined,
    },
  })),
  on(GdprActions.gdprExportSucceeded, GdprActions.getGdprExportSucceeded, (state, { exportId, expiresAt, downloadUrl }) => ({
    ...state,
    export: {
      ...state.export,
      status: 'success' as const,
      exportId,
      expiresAt,
      downloadUrl,
      error: undefined,
    },
  })),
  on(GdprActions.gdprExportFailed, (state, { error }) => ({
    ...state,
    export: {
      ...state.export,
      status: 'error' as const,
      error,
    },
  })),
  on(GdprActions.gdprExportReset, (state) => ({
    ...state,
    export: initialExportState,
  })),

  on(GdprActions.gdprDownloadUrlSucceeded, (state, { sasUrl }) => ({
    ...state,
    sasUrl,
  })),

  // Delete Account Actions
  on(GdprActions.deleteAccountRequested, (state) => ({
    ...state,
    deleteAccount: {
      ...state.deleteAccount,
      status: 'loading' as const,
      error: undefined,
    },
  })),
  on(GdprActions.deleteAccountSucceeded, (state) => ({
    ...state,
    deleteAccount: {
      ...state.deleteAccount,
      status: 'success' as const,
      error: undefined,
    },
  })),
  on(GdprActions.deleteAccountFailed, (state, { error }) => ({
    ...state,
    deleteAccount: {
      ...state.deleteAccount,
      status: 'error' as const,
      error,
    },
  })),
  on(GdprActions.deleteAccountStateReset, (state) => ({
    ...state,
    deleteAccount: initialDeleteAccountState,
  }))
);
