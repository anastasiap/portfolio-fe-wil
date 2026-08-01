export interface GdprExportState {
  status: 'idle' | 'loading' | 'success' | 'error';
  exportId?: string;
  expiresAt?: string;
  downloadUrl?: string;
  error?: unknown;
  sasUrl?: string;
}

export interface DeleteAccountState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: DeleteAccountStateError;
}

export interface DeleteAccountStateError {
  message: string;
}

export interface GdprState {
  export: GdprExportState;
  deleteAccount: DeleteAccountState;
}
