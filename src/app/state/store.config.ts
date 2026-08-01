import { ActionReducerMap } from '@ngrx/store';
import { personalReducer, wheelReducer } from './reducer';
import { authReducer } from './auth/auth.reducer';
import { gdprReducer } from './gdpr/gdpr.reducer';
import { AppState } from './typings';

export const reducers: ActionReducerMap<AppState> = {
  wheel: wheelReducer,
  personal: personalReducer,
  auth: authReducer,
  gdpr: gdprReducer,
};
