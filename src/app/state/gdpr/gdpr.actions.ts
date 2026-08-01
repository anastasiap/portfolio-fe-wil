import { createAction, props } from '@ngrx/store';
import { DeleteAccountStateError } from './gdpr.types';

// GDPR Export Actions
export const gdprExportRequested = createAction('[GDPR] Export Requested');

export const gdprExportSucceeded = createAction(
  '[GDPR] Export Succeeded',
  props<{ exportId: string; expiresAt: string; downloadUrl: string }>()
);

export const gdprExportFailed = createAction('[GDPR] Export Failed', props<{ error: unknown }>());

export const gdprExportReset = createAction('[GDPR] Export Reset');

// GDPR Download URL Actions
export const gdprDownloadUrlRequested = createAction('[GDPR] Download URL Requested', props<{ downloadUrl: string }>());

export const gdprDownloadUrlSucceeded = createAction('[GDPR] Download URL Succeeded', props<{ sasUrl: string }>());

export const gdprDownloadUrlFailed = createAction('[GDPR] Download URL Failed', props<{ error: unknown }>());

export const getGdprExport = createAction('[GDPR] Get GDPR Export');

export const getGdprExportSucceeded = createAction(
  '[GDPR] Get GDPR Export Succeeded',
  props<{ exportId: string; expiresAt: string; downloadUrl: string }>()
);

export const getGdprExportFailed = createAction('[GDPR] Get GDPR Export Failed', props<{ error: DeleteAccountStateError }>());

// Account Deletion Actions
export const deleteAccountRequested = createAction('[GDPR] Delete Account Requested');

export const deleteAccountSucceeded = createAction('[GDPR] Delete Account Succeeded');

export const deleteAccountFailed = createAction('[GDPR] Delete Account Failed', props<{ error: DeleteAccountStateError }>());

export const deleteAccountStateReset = createAction('[GDPR] Delete Account State Reset');
