import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GdprState } from './gdpr.types';

export const selectGdprFeature = createFeatureSelector<GdprState>('gdpr');

export const selectGdprExport = createSelector(selectGdprFeature, (state) => state.export);

export const selectGdprExportStatus = createSelector(selectGdprExport, (exportState) => exportState.status);

export const selectGdprExportLoading = createSelector(selectGdprExportStatus, (status) => status === 'loading');

// Delete Account Selectors
export const selectDeleteAccount = createSelector(selectGdprFeature, (state) => state.deleteAccount);

export const selectDeleteAccountStatus = createSelector(selectDeleteAccount, (deleteState) => deleteState.status);

export const selectDeleteAccountError = createSelector(selectDeleteAccount, (deleteState) => deleteState.error);

export const selectDeleteAccountLoading = createSelector(selectDeleteAccountStatus, (status) => status === 'loading');
