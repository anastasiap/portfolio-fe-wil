import { gdprReducer } from './gdpr.reducer';
import * as GdprActions from './gdpr.actions';
import { GdprState } from './gdpr.types';

describe('gdprReducer', () => {
  const initialState: GdprState = {
    export: {
      status: 'idle',
      exportId: undefined,
      expiresAt: undefined,
      downloadUrl: undefined,
      error: undefined,
      sasUrl: undefined,
    },
    deleteAccount: {
      status: 'idle',
      error: undefined,
    },
  };

  it('should return the initial state', () => {
    // Arrange
    const action = { type: 'unknown' } as never;

    // Act
    const result = gdprReducer(undefined, action);

    // Assert
    expect(result).toEqual(initialState);
  });

  it('should handle gdprExportRequested', () => {
    // Arrange
    const action = GdprActions.gdprExportRequested();

    // Act
    const result = gdprReducer(initialState, action);

    // Assert
    expect(result.export.status).toBe('loading');
    expect(result.export.error).toBeUndefined();
  });

  it('should handle gdprExportSucceeded', () => {
    // Arrange
    const loadingState = gdprReducer(initialState, GdprActions.gdprExportRequested());
    const action = GdprActions.gdprExportSucceeded({
      exportId: 'test-export-id',
      expiresAt: '2026-02-17T10:00:00.000Z',
      downloadUrl: '/gdpr/exports/test-export-id/download',
    });

    // Act
    const result = gdprReducer(loadingState, action);

    // Assert
    expect(result.export.status).toBe('success');
    expect(result.export.exportId).toBe('test-export-id');
    expect(result.export.expiresAt).toBe('2026-02-17T10:00:00.000Z');
    expect(result.export.downloadUrl).toBe('/gdpr/exports/test-export-id/download');
    expect(result.export.error).toBeUndefined();
  });

  it('should handle gdprExportFailed', () => {
    // Arrange
    const loadingState = gdprReducer(initialState, GdprActions.gdprExportRequested());
    const error = { status: 500, message: 'Server error' };
    const action = GdprActions.gdprExportFailed({ error });

    // Act
    const result = gdprReducer(loadingState, action);

    // Assert
    expect(result.export.status).toBe('error');
    expect(result.export.error).toBe(error);
  });

  it('should handle gdprExportReset', () => {
    // Arrange
    const stateWithData = gdprReducer(
      initialState,
      GdprActions.gdprExportSucceeded({
        exportId: 'test-export-id',
        expiresAt: '2026-02-17T10:00:00.000Z',
        downloadUrl: '/gdpr/exports/test-export-id/download',
      })
    );
    const action = GdprActions.gdprExportReset();

    // Act
    const result = gdprReducer(stateWithData, action);

    // Assert
    expect(result.export).toEqual(initialState.export);
  });

  it('should preserve other state properties when updating export', () => {
    // Arrange
    const action = GdprActions.gdprExportRequested();

    // Act
    const result = gdprReducer(initialState, action);

    // Assert
    expect(Object.keys(result)).toEqual(['export', 'deleteAccount']);
    expect(result.export.status).toBe('loading');
  });

  describe('Delete Account Actions', () => {
    it('should handle deleteAccountRequested', () => {
      // Arrange
      const action = GdprActions.deleteAccountRequested();

      // Act
      const result = gdprReducer(initialState, action);

      // Assert
      expect(result.deleteAccount.status).toBe('loading');
      expect(result.deleteAccount.error).toBeUndefined();
    });

    it('should handle deleteAccountSucceeded', () => {
      // Arrange
      const loadingState = gdprReducer(initialState, GdprActions.deleteAccountRequested());
      const action = GdprActions.deleteAccountSucceeded();

      // Act
      const result = gdprReducer(loadingState, action);

      // Assert
      expect(result.deleteAccount.status).toBe('success');
      expect(result.deleteAccount.error).toBeUndefined();
    });

    it('should handle deleteAccountFailed', () => {
      // Arrange
      const loadingState = gdprReducer(initialState, GdprActions.deleteAccountRequested());
      const error = { status: 403, message: 'Forbidden' };
      const action = GdprActions.deleteAccountFailed({ error });

      // Act
      const result = gdprReducer(loadingState, action);

      // Assert
      expect(result.deleteAccount.status).toBe('error');
      expect(result.deleteAccount.error).toEqual(error);
    });

    it('should handle deleteAccountStateReset', () => {
      // Arrange
      const stateWithError = gdprReducer(initialState, GdprActions.deleteAccountFailed({ error: { message: 'test error' } }));
      const action = GdprActions.deleteAccountStateReset();

      // Act
      const result = gdprReducer(stateWithError, action);

      // Assert
      expect(result.deleteAccount).toEqual(initialState.deleteAccount);
    });
  });
});
