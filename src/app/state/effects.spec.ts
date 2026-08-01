import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TestScheduler } from 'rxjs/testing';
import { Observable } from 'rxjs';
import {
  createWheelForUser,
  createWheelForUserFailure,
  createWheelForUserSuccess,
  deleteCategory,
  deleteCategorySuccess,
  deleteSession,
  deleteSessionFailure,
  deleteSessionSuccess,
  getWheelVersionById,
  getWheelVersionByIdSuccess,
  loadDefaultTemplate,
  loadDefaultTemplateSuccess,
  saveClientFocus,
  saveClientFocusForParticipant,
  saveClientFocusForParticipantSuccess,
  saveClientFocusSuccess,
  saveSession,
  saveSessionFailure,
  saveSessionSuccess,
  switchPersonalWheel,
  updatePersonalWheel,
  updateWheelOnSaveClientFocusSuccess,
} from './actions';
import { WheelEffects } from './effects';
import { selectActiveWheel, selectLang, selectSessions, selectUserWheels } from './selectors';
import { selectAccountId } from './auth/auth.selectors';
import { SingleWheelState, WheelStateCategory } from './typings';
import { WheelsApiService } from '../services/api/wheels-api.service';
import { ProfessionalApiService } from '../services/api/professional-api.service';
import { SupportService } from '../services/api/support.service';
import { NotificationService } from '../services/notification.service';
import { defaultWheelIdByLocale } from '../features/wheel/wheel.constants';
import { SessionSavedDialogComponent } from '../ui/dialogs/session-saved-dialog/session-saved-dialog.component';

describe('WheelEffects', () => {
  let actions$: Observable<Action>;
  let effects: WheelEffects;
  let mockStore: MockStore;
  let testScheduler: TestScheduler;
  let wheelsApiService: jasmine.SpyObj<WheelsApiService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let http: jasmine.SpyObj<HttpClient>;

  const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'health',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 5,
    ...overrides,
  });

  const createActiveWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
    id: 'wheel-1',
    categories: [createCategory()],
    name: 'Life Balance',
    descriptionKey: 0,
    wheelKey: 0,
    focus: ['health'],
    focusLoading: false,
    loading: false,
    sessionDraft: {
      noteMd: 'Session note',
      noteUpdatedAt: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  });

  const createWheelVersion = (overrides: Partial<WheelVersion> = {}): WheelVersion => ({
    id: 'wheel-1',
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    accountId: 'account-1',
    version: 1,
    name: 'Life Balance',
    categorySnapshots: [
      {
        categoryId: 'health',
        label: 'Health',
        description: 'Physical wellbeing',
        color: '#ff0000',
        isArchived: false,
      },
    ],
    focusIds: ['health'],
    isDefault: true,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  const createSession = (overrides: Partial<WheelSessionOutputDto> = {}): WheelSessionOutputDto => ({
    id: 'session-1',
    userId: 'user-1',
    accountId: 'account-1',
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    scores: [{ categoryId: 'health', value: 8 }],
    focusAtSubmit: ['health'],
    locale: 'en',
    notes: null,
    submittedAt: '2026-01-02T00:00:00.000Z',
    isDeleted: false,
    ...overrides,
  });

  const createSessionDto = (overrides: Partial<CreateSessionDto> = {}): CreateSessionDto => ({
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    scores: [{ categoryId: 'health', value: 8 }],
    focusAtSubmit: ['health'],
    locale: 'en',
    ...overrides,
  });

  const createTemplate = (overrides: Partial<WheelTemplateDetailDto> = {}): WheelTemplateDetailDto => ({
    id: 'template-1',
    name: 'Default Wheel',
    latestVersionId: 'version-1',
    version: 1,
    categories: [
      {
        categoryId: 'health',
        label: 'Health',
        description: 'Physical wellbeing',
        color: '#ff0000',
        isArchived: false,
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    wheelsApiService = jasmine.createSpyObj<WheelsApiService>('WheelsApiService', [
      'createFocus',
      'createFocusForParticipant',
      'createSession',
      'createSessionForParticipant',
      'createWheel',
      'deleteCategory',
      'deleteSession',
      'fetchFreePlanDefaultTemplate',
      'fetchWheelVersionById',
      'updateWheel',
    ]);
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['showError', 'showSuccess']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        WheelEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: {} }),
        { provide: WheelsApiService, useValue: wheelsApiService },
        {
          provide: ProfessionalApiService,
          useValue: jasmine.createSpyObj<ProfessionalApiService>('ProfessionalApiService', [
            'createBrand',
            'createClient',
            'createLink',
            'deleteClient',
            'deleteLink',
            'fetchBrand',
            'fetchClients',
            'fetchLinkData',
            'updateBrand',
            'updateClient',
          ]),
        },
        {
          provide: SupportService,
          useValue: jasmine.createSpyObj<SupportService>('SupportService', [
            'submitFeatureRequest',
            'submitSupportRequest',
            'submitWhiteLabelRequest',
          ]),
        },
        { provide: NotificationService, useValue: notificationService },
        { provide: MatDialog, useValue: dialog },
        { provide: HttpClient, useValue: http },
      ],
    });

    mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectLang, 'en');
    mockStore.overrideSelector(selectSessions, []);
    effects = TestBed.inject(WheelEffects);
    testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  afterEach(() => {
    mockStore?.resetSelectors();
  });

  it('should dispatch deleteCategorySuccess on successful API call', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const action = deleteCategory({ id: 'cat1' });
      const outcome = deleteCategorySuccess({ id: 'cat1' });

      actions$ = hot('-a', { a: action });
      wheelsApiService.deleteCategory.and.returnValue(cold('-b|', { b: undefined }));

      expectObservable(effects.deleteCategory$).toBe('--c', { c: outcome });
    });
  });

  it('should load the default template using the current language selector value', () => {
    mockStore.overrideSelector(selectLang, 'en');
    mockStore.refreshState();

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const template = createTemplate({ id: defaultWheelIdByLocale('en') });
      const action = loadDefaultTemplate({ wheelId: 'ignored-action-wheel-id' });
      const outcome = loadDefaultTemplateSuccess({
        wheel: {
          id: template.id,
          categories: [
            {
              id: 'health',
              name: 'Health',
              description: 'Physical wellbeing',
              color: '#ff0000',
              order: 1,
              score: 0,
            },
          ],
          name: 'Default Wheel',
          descriptionKey: 0,
          wheelKey: 0,
          focus: [],
          focusLoading: false,
          loading: false,
        },
      });

      actions$ = hot('-a', { a: action });
      wheelsApiService.fetchFreePlanDefaultTemplate.and.returnValue(cold('-b|', { b: template }));

      expectObservable(effects.loadFreePlanDefaultTemplate$).toBe('--c', { c: outcome });
      flush();
      expect(wheelsApiService.fetchFreePlanDefaultTemplate).toHaveBeenCalledOnceWith(defaultWheelIdByLocale('en'));
    });
  });

  it('should load wellbeing categories from assets when loading the default template fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const categories = [createCategory({ score: 0, order: 1 })];
      const action = loadDefaultTemplate({ wheelId: 'ignored-action-wheel-id' });
      const id = defaultWheelIdByLocale('en');

      actions$ = hot('-a', { a: action });
      wheelsApiService.fetchFreePlanDefaultTemplate.and.returnValue(cold('-#', undefined, new Error('Unavailable')));
      http.get.and.returnValue(cold('-b|', { b: { en: categories } }));

      expectObservable(effects.loadFreePlanDefaultTemplate$).toBe('---c', {
        c: loadDefaultTemplateSuccess({
          wheel: {
            id,
            categories,
            name: 'Wellbeing',
            descriptionKey: 0,
            wheelKey: 0,
            focus: [],
            focusLoading: false,
            loading: false,
          },
        }),
      });
      flush();
      expect(http.get).toHaveBeenCalledOnceWith('assets/categories_wellbeing.json');
    });
  });

  it('should map a fetched wheel version with the selected session from store state', () => {
    const matchingSession = createSession();
    mockStore.overrideSelector(selectSessions, [
      createSession({ id: 'other-session', scores: [{ categoryId: 'health', value: 2 }] }),
      matchingSession,
    ]);
    mockStore.refreshState();

    testScheduler.run(({ hot, cold, expectObservable }) => {
      const action = getWheelVersionById({ id: 'version-1', sessionId: 'session-1' });
      const outcome = getWheelVersionByIdSuccess({
        wheel: {
          id: 'wheel-1',
          categories: [
            {
              id: 'health',
              name: 'Health',
              description: 'Physical wellbeing',
              color: '#ff0000',
              order: 0,
              score: 8,
            },
          ],
          name: 'Life Balance',
          descriptionKey: 0,
          wheelKey: 0,
          focus: ['health'],
          focusLoading: false,
          loading: false,
        },
      });

      actions$ = hot('-a', { a: action });
      wheelsApiService.fetchWheelVersionById.and.returnValue(cold('-b|', { b: createWheelVersion() }));

      expectObservable(effects.getWheelVersionById$).toBe('--c', { c: outcome });
    });
  });

  it('should save focus without a token and dispatch saveClientFocusSuccess', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action = saveClientFocus({ wheelId: 'wheel-1', newFocus: ['health'] });
      const outcome = saveClientFocusSuccess({ focus: ['health'], wheelId: 'wheel-1' });

      actions$ = hot('-a', { a: action });
      wheelsApiService.createFocus.and.returnValue(cold('-b|', { b: { categoryIds: ['health'] } as WheelFocusOutputDto }));

      expectObservable(effects.saveClientFocus$).toBe('--c', { c: outcome });
      flush();
      expect(wheelsApiService.createFocus).toHaveBeenCalledOnceWith('wheel-1', ['health']);
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Focus saved.');
    });
  });

  it('should ignore saveClientFocus actions that include a participant token', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      actions$ = hot('-a-|', {
        a: saveClientFocus({ wheelId: 'wheel-1', newFocus: ['health'], token: 'participant-token' }),
      });

      expectObservable(effects.saveClientFocus$).toBe('---|');
      flush();
      expect(wheelsApiService.createFocus).not.toHaveBeenCalled();
    });
  });

  it('should save participant focus through the participant API branch', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action = saveClientFocusForParticipant({ newFocus: ['health'], token: 'participant-token' });
      const outcome = saveClientFocusForParticipantSuccess({ focus: ['health'] });

      actions$ = hot('-a', { a: action });
      wheelsApiService.createFocusForParticipant.and.returnValue(cold('-b|', { b: { categoryIds: ['health'] } as WheelFocusOutputDto }));

      expectObservable(effects.saveClientFocusForParticipant$).toBe('--c', { c: outcome });
      flush();
      expect(wheelsApiService.createFocusForParticipant).toHaveBeenCalledOnceWith(['health'], 'participant-token');
    });
  });

  it('should ignore participant focus actions without a token', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      actions$ = hot('-a-|', {
        a: saveClientFocusForParticipant({ newFocus: ['health'], token: '' }),
      });

      expectObservable(effects.saveClientFocusForParticipant$).toBe('---|');
      flush();
      expect(wheelsApiService.createFocusForParticipant).not.toHaveBeenCalled();
    });
  });

  it('should dispatch a follow-up action after saveClientFocusSuccess updates the wheel', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action = saveClientFocusSuccess({ focus: ['health'], wheelId: 'wheel-1' });

      actions$ = hot('-a', { a: action });
      wheelsApiService.updateWheel.and.returnValue(cold('-b|', { b: [] }));

      expectObservable(effects.saveClientFocusSuccess$).toBe('--c', { c: updateWheelOnSaveClientFocusSuccess() });
      flush();
      expect(wheelsApiService.updateWheel).toHaveBeenCalledOnceWith('wheel-1', {});
    });
  });

  it('should notify and dispatch success when creating a wheel succeeds', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const wheels = [createWheelVersion()];

      actions$ = hot('-a', { a: createWheelForUser({ name: 'New Wheel', categoryIds: [], isDefault: true }) });
      wheelsApiService.createWheel.and.returnValue(cold('-b|', { b: wheels }));

      expectObservable(effects.createWheelForUser$).toBe('--c', { c: createWheelForUserSuccess({ wheels }) });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('A wheel is successfully created!');
    });
  });

  it('should show a network message when creating a wheel fails with a network or server error', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 500, message: 'Server unavailable' };

      actions$ = hot('-a', { a: createWheelForUser({ name: 'New Wheel', categoryIds: [], isDefault: true }) });
      wheelsApiService.createWheel.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.createWheelForUser$).toBe('--c', {
        c: createWheelForUserFailure({ error: 'Server unavailable' }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Network error. Please check your connection and try again.');
    });
  });

  it('should show the API message when creating a wheel fails with a client error', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 400, message: 'Wheel limit reached' };

      actions$ = hot('-a', { a: createWheelForUser({ name: 'New Wheel', categoryIds: [], isDefault: true }) });
      wheelsApiService.createWheel.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.createWheelForUser$).toBe('--c', {
        c: createWheelForUserFailure({ error: 'Wheel limit reached' }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Wheel limit reached');
    });
  });

  it('should dispatch an update action when switching personal wheels without saving', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const wheel = createWheelVersion({
        id: 'wheel-2',
        name: 'Career Wheel',
        categorySnapshots: [
          {
            categoryId: 'career',
            label: 'Career',
            description: 'Work',
            color: '#00ff00',
            isArchived: false,
          },
        ],
      });

      mockStore.overrideSelector(selectActiveWheel, createActiveWheel());
      mockStore.overrideSelector(selectAccountId, 'account-1');
      mockStore.overrideSelector(selectUserWheels, [createWheelVersion(), wheel]);
      mockStore.refreshState();

      actions$ = hot('-a', { a: switchPersonalWheel({ wheel }) });

      expectObservable(effects.switchPersonalWheel$).toBe('-b', {
        b: updatePersonalWheel({
          wheelId: 'wheel-2',
          updates: { name: 'Career Wheel', isDefault: true, categoryIds: ['career'] },
          skipNotify: true,
        }),
      });
    });
  });

  it('should dispatch saveSession before updating the selected personal wheel when requested', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const activeWheel = createActiveWheel({
        categories: [createCategory({ id: 'health', score: 7 })],
      });
      const currentWheel = createWheelVersion({ id: 'wheel-1', wheelVersionId: 'version-1' });
      const nextWheel = createWheelVersion({ id: 'wheel-2', name: 'Career Wheel' });

      mockStore.overrideSelector(selectActiveWheel, activeWheel);
      mockStore.overrideSelector(selectAccountId, 'account-1');
      mockStore.overrideSelector(selectUserWheels, [currentWheel, nextWheel]);
      mockStore.refreshState();

      actions$ = hot('-a', { a: switchPersonalWheel({ wheel: nextWheel, shouldSaveSession: true }) });

      expectObservable(effects.switchPersonalWheel$).toBe('-(bc)', {
        b: saveSession({
          activeWheel,
          session: {
            wheelId: 'wheel-1',
            wheelVersionId: 'version-1',
            scores: [{ categoryId: 'health', value: 7 }],
            focusAtSubmit: ['health'],
            locale: 'en',
          },
        }),
        c: updatePersonalWheel({
          wheelId: 'wheel-2',
          updates: { name: 'Career Wheel', isDefault: true, categoryIds: ['health'] },
          skipNotify: true,
        }),
      });
    });
  });

  it('should save a session, notify the user, and dispatch saveSessionSuccess', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const activeWheel = createActiveWheel();
      const session = createSessionDto();
      const sessions = [createSession()];

      actions$ = hot('-a', { a: saveSession({ activeWheel, session }) });
      wheelsApiService.createSession.and.returnValue(cold('-b|', { b: sessions }));

      expectObservable(effects.saveSession$).toBe('--c', { c: saveSessionSuccess({ sessions }) });
      flush();
      expect(wheelsApiService.createSession).toHaveBeenCalledOnceWith({
        wheelId: 'wheel-1',
        wheelVersionId: 'version-1',
        scores: [{ categoryId: 'health', value: 8 }],
        focusAtSubmit: ['health'],
        locale: 'en',
        notes: 'Session note',
      });
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Session saved.');
    });
  });

  it('should open the session saved dialog once for a live saveSessionSuccess action', () => {
    testScheduler.run(({ hot, flush }) => {
      const sessions = [createSession()];

      actions$ = hot('-a', { a: saveSessionSuccess({ sessions }) });

      effects.showSessionSavedDialog$.subscribe();
      flush();

      expect(dialog.open).toHaveBeenCalledOnceWith(SessionSavedDialogComponent, {
        data: {
          autoCloseTimeSeconds: 5,
        },
        width: '450px',
        disableClose: false,
      });
    });
  });

  it('should not open the session saved dialog without a live saveSessionSuccess action', () => {
    testScheduler.run(({ hot, flush }) => {
      actions$ = hot('---');

      effects.showSessionSavedDialog$.subscribe();
      flush();

      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  it('should notify and dispatch saveSessionFailure when saving a non-participant session fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { message: 'Could not save session' };

      actions$ = hot('-a', { a: saveSession({ activeWheel: createActiveWheel(), session: createSessionDto() }) });
      wheelsApiService.createSession.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.saveSession$).toBe('--c', {
        c: saveSessionFailure({ error: 'Could not save session' }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Could not save session');
    });
  });

  it('should surface participant session API errors because that branch has no catchError', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const error = { message: 'Participant session failed' };

      actions$ = hot('-a', {
        a: saveSession({ activeWheel: createActiveWheel(), session: createSessionDto(), token: 'participant-token' }),
      });
      wheelsApiService.createSessionForParticipant.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.saveSession$).toBe('--#', undefined, error);
    });
  });

  it('should notify and dispatch deleteSessionSuccess when deleting a session succeeds', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', { a: deleteSession({ id: 'session-1' }) });
      wheelsApiService.deleteSession.and.returnValue(cold('-b|', { b: undefined }));

      expectObservable(effects.deleteSessions$).toBe('--c', { c: deleteSessionSuccess({ id: 'session-1' }) });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Session is deleted successfully.');
    });
  });

  it('should notify and dispatch deleteSessionFailure when deleting a session fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { message: 'Delete failed' };

      actions$ = hot('-a', { a: deleteSession({ id: 'session-1' }) });
      wheelsApiService.deleteSession.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.deleteSessions$).toBe('--c', {
        c: deleteSessionFailure({ error: 'Delete failed' }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Error deleting session. Please try again later.');
    });
  });
});
