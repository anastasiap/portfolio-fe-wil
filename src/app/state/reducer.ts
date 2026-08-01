import { createReducer, on } from '@ngrx/store';
import {
  addCategoryFailure,
  addCategorySuccess,
  addFreePlanCategory,
  clearSessionDraftNote,
  createBrandFailure,
  createBrandSuccess,
  createClientFailure,
  createClientSuccess,
  createWheelForUser,
  createWheelForUserFailure,
  createWheelForUserSuccess,
  deleteCategoryFailure,
  deleteCategorySuccess,
  deleteClientFailure,
  deleteClientSuccess,
  deleteFreePlanCategory,
  deleteLinkFailure,
  deleteLinkSuccess,
  deletePersonalWheelSuccess,
  deleteSession,
  deleteSessionFailure,
  deleteSessionSuccess,
  destroyWheel,
  editCategoryFailure,
  editCategorySuccess,
  editFreePlanCategory,
  getLinkDataByTokenSuccess,
  getUserSessions,
  getUserSessionsFailure,
  getUserSessionsSuccess,
  getWheelVersionById,
  getWheelVersionByIdFailure,
  getWheelVersionByIdSuccess,
  initializeWheel,
  loadBrandFailure,
  loadBrandSuccess,
  loadClientFocus,
  loadClientFocusFailure,
  loadClientFocusSuccess,
  loadClientsSuccess,
  loadDefaultTemplateSuccess,
  loadUserWheels,
  loadUserWheelsFailure,
  loadUserWheelsSuccess,
  loadWheelForParticipantFailure,
  loadWheelForParticipantSuccess,
  resetMarks,
  resetSession,
  resetUserWheels,
  saveClientFocus,
  saveClientFocusFailure,
  saveClientFocusForParticipantSuccess,
  saveClientFocusSuccess,
  saveSessionFailure,
  saveSessionSuccess,
  setActiveWheel,
  setLanguage,
  setMode,
  setScore,
  setSessionDraftNote,
  setWheelNewName,
  updateBrandFailure,
  updateBrandSuccess,
  updateClientFailure,
  updateClientSuccess,
  updatePersonalWheel,
  updatePersonalWheelFailure,
  updatePersonalWheelSuccess,
} from './actions';
import { PersonalState, SingleWheelState, WheelState, WheelStateCategory } from './typings';

export const initialState: WheelState = {
  activeWheel: null,
  homeWheelKey: 0,
  mode: 'view',
  lang: 'en',
  linkData: null,
};

const createInitialWheelState = (): SingleWheelState => ({
  id: '',
  categories: [],
  name: 'Wheel of Life',
  descriptionKey: 0,
  wheelKey: 0,
  focus: [],
  focusLoading: false,
  loading: false,
});

export const wheelReducer = createReducer(
  initialState,

  // Wheel Lifecycle
  on(initializeWheel, (state, { wheelId }) => {
    const activeWheel = wheelId ? state.activeWheel : createInitialWheelState();

    return {
      ...state,
      activeWheel,
    };
  }),

  on(setActiveWheel, (state, { wheel }) => ({
    ...state,
    activeWheel: { ...wheel },
  })),

  on(setMode, (state, { mode }) => {
    return {
      ...state,
      mode,
    };
  }),

  on(resetSession, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: wheelState.categories.map((c) => ({ ...c, score: 0 })),
        sessionDraft: undefined,
      },
    };
  }),

  on(destroyWheel, (state) => ({
    ...state,
    activeWheel: null,
    mode: 'view' as const,
  })),

  // Load Data
  on(loadDefaultTemplateSuccess, (state, { wheel }) => ({
    ...state,
    activeWheel: wheel,
  })),

  on(getWheelVersionById, (state) => ({
    ...state,
    loading: true,
  })),

  on(getWheelVersionByIdSuccess, (state, { wheel }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheel,
        loading: false,
      },
    };
  }),

  // Category Management
  on(deleteCategorySuccess, deleteFreePlanCategory, (state, { id }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: wheelState.categories.filter((category) => category.id !== id),
      },
    };
  }),

  on(deleteCategoryFailure, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        loading: false,
        categories: wheelState.categories,
      },
    };
  }),

  on(addFreePlanCategory, (state, { color }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    const order = wheelState.categories.length + 1;
    const newCategory: WheelStateCategory = {
      order,
      id: `${wheelState.categories[0].id.slice(0, 23)}${order}`,
      color,
      description: '',
      score: 0,
      name: 'New Category',
    };

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: [...wheelState.categories, newCategory],
      },
    };
  }),

  on(addCategorySuccess, (state, { category }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: [...wheelState.categories, { ...category, order: wheelState.categories.length + 1 }],
      },
    };
  }),

  on(addCategoryFailure, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        loading: false,
      },
    };
  }),

  on(editCategorySuccess, (state, { category }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: wheelState.categories.map((cat) => (cat.id === category.id ? category : cat)),
      },
    };
  }),

  on(editFreePlanCategory, (state, { category }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: wheelState.categories.map((cat) => (cat.id === category.id ? category : cat)),
      },
    };
  }),

  on(setWheelNewName, (state, { name }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        name,
      },
    };
  }),

  on(setScore, (state, { categoryId, score }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: wheelState.categories.map((cat) => (cat.id === categoryId ? { ...cat, score } : cat)),
      },
    };
  }),

  on(editCategoryFailure, getWheelVersionByIdFailure, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        loading: false,
      },
    };
  }),

  on(resetMarks, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        categories: wheelState.categories.map((category) => ({
          ...category,
          score: 0,
        })),
      },
    };
  }),

  // Session Draft Note Management
  on(setSessionDraftNote, (state, { noteMd }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        sessionDraft: {
          noteMd,
          noteUpdatedAt: new Date().toISOString(),
        },
      },
    };
  }),

  on(clearSessionDraftNote, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        sessionDraft: undefined,
      },
    };
  }),

  // Clear draft note when session is successfully saved
  on(saveSessionSuccess, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        sessionDraft: undefined,
      },
      lastAction: {
        type: saveSessionSuccess.type,
        timestamp: Date.now(),
      },
    };
  }),

  on(saveSessionFailure, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        loading: false,
      },
      lastAction: {
        type: saveSessionFailure.type,
        timestamp: Date.now(),
      },
    };
  }),

  // Language
  on(setLanguage, (state, { lang }) => ({
    ...state,
    lang,
  })),

  // Focus Management
  on(loadClientFocus, (state) => {
    return {
      ...state,
      activeWheel: {
        // Preserve existing wheel state
        ...state.activeWheel!,
        focusLoading: true,
      },
    };
  }),

  on(loadClientFocusSuccess, (state, { focus }) => ({
    ...state,
    activeWheel: {
      ...state.activeWheel!,
      focus,
      focusLoading: false,
    },
  })),

  on(loadClientFocusFailure, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        focusLoading: false,
      },
    };
  }),

  on(saveClientFocus, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        focusLoading: true,
      },
    };
  }),

  on(saveClientFocusSuccess, saveClientFocusForParticipantSuccess, (state, { focus }) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        focus,
        focusLoading: false,
      },
    };
  }),

  on(getLinkDataByTokenSuccess, (state, { data }) => ({
    ...state,
    linkData: data,
  })),

  on(saveClientFocusFailure, (state) => {
    const wheelState = state.activeWheel;
    if (!wheelState) return state;

    return {
      ...state,
      activeWheel: {
        ...wheelState,
        focusLoading: false,
      },
    };
  })
);

// Personal Reducer
export const initialPersonalState: PersonalState = {
  wheels: [],
  clients: [],
  sessions: [],
  brand: null,
  loading: false,
  error: null,
};

export const personalReducer = createReducer(
  initialPersonalState,

  // Loading states
  on(loadUserWheels, createWheelForUser, updatePersonalWheel, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(resetUserWheels, (state) => ({
    ...state,
    wheels: [],
    loading: false,
    error: null,
  })),

  // Load user wheels
  on(loadUserWheelsSuccess, (state, { wheels }) => ({
    ...state,
    wheels,
    loading: false,
    error: null,
  })),

  on(loadWheelForParticipantSuccess, (state, { wheel }) => ({
    ...state,
    wheels: [wheel],
    loading: false,
    error: null,
  })),

  on(getUserSessions, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(getUserSessionsSuccess, (state, { sessions }) => ({
    ...state,
    sessions,
    loading: false,
    error: null,
  })),

  on(loadUserWheelsFailure, loadWheelForParticipantFailure, (state, { error }) => ({
    ...state,
    wheels: [],
    loading: false,
    error,
  })),

  // Create user wheel
  on(createWheelForUserSuccess, (state, { wheels }) => ({
    ...state,
    wheels: wheels,
    loading: false,
    error: null,
  })),

  on(createWheelForUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // update the wheel
  on(updatePersonalWheelSuccess, (state, { wheels }) => ({
    ...state,
    wheels,
    loading: false,
    error: null,
  })),

  on(updatePersonalWheelFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // delete the wheel
  on(deletePersonalWheelSuccess, (state, { wheels }) => ({
    ...state,
    wheels,
    loading: false,
    error: null,
  })),

  on(updatePersonalWheelFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(deleteSession, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(deleteSessionSuccess, (state, { id }) => ({
    ...state,
    sessions: [...state.sessions.filter((s) => s.id !== id)],
    loading: false,
    error: null,
  })),

  //// Professional plan
  on(loadClientsSuccess, (state, { clients }) => ({
    ...state,
    clients,
    loading: false,
    error: null,
  })),

  // create client
  on(createClientSuccess, (state, { client }) => ({
    ...state,
    clients: [...state.clients, client],
    loading: false,
    error: null,
  })),

  on(createClientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(updateClientSuccess, (state, { client }) => ({
    ...state,
    clients: [...state.clients.filter((c) => c.id !== client.id), client],
    loading: false,
    error: null,
  })),

  on(updateClientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(deleteClientSuccess, (state, { id }) => ({
    ...state,
    clients: [...state.clients.filter((c) => c.id !== id)],
    loading: false,
    error: null,
  })),

  on(deleteClientFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(loadBrandSuccess, createBrandSuccess, updateBrandSuccess, (state, { brand }) => ({
    ...state,
    brand,
    loading: false,
    error: null,
  })),

  on(loadBrandFailure, createBrandFailure, updateBrandFailure, getUserSessionsFailure, deleteSessionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(deleteLinkSuccess, (state, { id }) => {
    const participant = state.clients.find((c) => c.assignedWheelsResolved.some((l) => l.id === id));
    let resolvedLinks: ResolvedWheelLink[] = [];
    let links: string[] = [];
    if (participant) {
      resolvedLinks = participant.assignedWheelsResolved.filter((l) => l.id !== id);
      links = participant.assignedWheels.filter((l) => l !== id);

      return {
        ...state,
        clients: [
          ...state.clients.filter((c) => c.id !== participant.id),
          { ...participant, assignedWheels: links, assignedWheelsResolved: resolvedLinks },
        ],
        loading: false,
        error: null,
      };
    }

    return {
      ...state,
      loading: false,
      error: null,
    };
  }),

  on(deleteLinkFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
