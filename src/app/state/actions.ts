import { createAction, props } from '@ngrx/store';
import { SingleWheelState, WheelStateCategory } from './typings';

// Active Wheel Lifecycle Actions
export const initializeWheel = createAction('[Wheel] Initialize Wheel', props<{ wheelId: string }>());

export const destroyWheel = createAction('[Wheel] Destroy Wheel');

export const setActiveWheel = createAction('[Wheel] Set Active Wheel', props<{ wheel: SingleWheelState }>());
export const setActiveWheelFailure = createAction('[Wheel] Set Active Wheel Failure');

export const loadDefaultTemplate = createAction('[Default Wheel] Load Default Categories', props<{ wheelId: string; language?: string }>());
export const loadDefaultTemplateSuccess = createAction(
  '[Default Wheel] Load Default Categories Success',
  props<{ wheel: SingleWheelState }>()
);
export const loadDefaultTemplateFailure = createAction('[Default Wheel] Load Default Categories Failure', props<{ error: string }>());

// Category Management Actions
export const deleteFreePlanCategory = createAction('[Wheel] Delete   Free Plan Category', props<{ id: string }>());
export const deleteCategory = createAction('[Wheel] Delete Category', props<{ id: string }>());
export const deleteCategorySuccess = createAction('[Wheel] Delete Category Success', props<{ id: string }>());
export const deleteCategoryFailure = createAction(
  '[Wheel] Delete Category Failure',
  props<{
    error: string;
  }>()
);

export const deleteSession = createAction('[Wheel] Delete Session', props<{ id: string }>());
export const deleteSessionSuccess = createAction('[Wheel] Delete Session Success', props<{ id: string }>());
export const deleteSessionFailure = createAction(
  '[Wheel] Delete Session',
  props<{
    error: string;
  }>()
);

export const addFreePlanCategory = createAction('[Wheel] Add Free Plan Category', props<{ color: string }>());
export const addCategory = createAction('[Wheel] Add Category', props<{ color: string }>());
export const addCategorySuccess = createAction('[Wheel] Add Category Success', props<{ category: WheelStateCategory }>());
export const addCategoryFailure = createAction(
  '[Wheel] Add Category Failure',
  props<{
    error: string;
  }>()
);

export const editFreePlanCategory = createAction(
  '[Wheel] Edit Free Plan Category',
  props<{
    category: WheelStateCategory;
  }>()
);
export const editCategory = createAction(
  '[Wheel] Edit Category',
  props<{
    categoryId: string;
    label: string;
    description: string;
    color: string;
  }>()
);
export const editCategorySuccess = createAction('[Wheel] Edit Category Success', props<{ category: WheelStateCategory }>());
export const editCategoryFailure = createAction(
  '[Wheel] Edit Category Failure',
  props<{
    error: string;
  }>()
);

export const setScore = createAction('[Wheel] Set Score', props<{ categoryId: string; score: number }>());

export const setWheelNewName = createAction('[Wheel] Set Wheel New Name', props<{ name: string }>());

export const resetMarks = createAction('[Wheel] Reset Marks');

// Language Actions
export const setLanguage = createAction('[Wheel] Set Language', props<{ lang: Locale }>());

// Focus Actions
export const loadClientFocus = createAction(
  '[Focus] Load Client Focus',
  props<{
    wheelId: string;
    clientId: string;
  }>()
);

export const loadClientFocusSuccess = createAction(
  '[Focus] Load Client Focus Success',
  props<{
    focus: string[];
  }>()
);

export const loadClientFocusFailure = createAction(
  '[Focus] Load Client Focus Failure',
  props<{
    error: string;
  }>()
);

export const saveClientFocus = createAction(
  '[Focus] Save Client Focus',
  props<{
    wheelId: string;
    newFocus: string[];
    token?: string;
  }>()
);
export const saveClientFocusSuccess = createAction('[Focus] Save Client Focus Success', props<{ focus: string[]; wheelId: string }>());
export const updateWheelOnSaveClientFocusSuccess = createAction('[Focus] Update Wheel On Save Client Focus Success');
export const saveClientFocusFailure = createAction('[Focus] Save Client Focus Failure', props<{ error: string }>());

export const saveClientFocusForParticipant = createAction(
  '[Focus] Save Client Focus For Participant',
  props<{
    newFocus: string[];
    token: string;
  }>()
);
export const saveClientFocusForParticipantSuccess = createAction(
  '[Focus] Save Client Focus  For Participant Success',
  props<{ focus: string[] }>()
);
export const saveClientFocusForParticipantFailure = createAction(
  '[Focus] Save Client Focus For Participant Failure',
  props<{ error: string }>()
);

export const setMode = createAction(
  '[Wheel] Set Mode',
  props<{
    mode: 'edit' | 'view';
  }>()
);

// Personal Plan Actions
export const loadUserWheels = createAction('[Personal] Load User Wheels');
export const loadUserWheelsSuccess = createAction('[Personal] Load User Wheels Success', props<{ wheels: WheelVersion[] }>());
export const loadUserWheelsFailure = createAction('[Personal] Load User Wheels Failure', props<{ error: string }>());
export const loadWheelsTemplates = createAction('[Personal] Load Wheel Templates');
export const resetUserWheels = createAction('[Personal] Reset User Wheels');
export const createWheelForUser = createAction(
  '[Personal] Create User Wheel',
  props<Omit<WheelOutputDto, 'id' | 'createdAt' | 'lastModified' | 'accountId'>>()
);
export const createWheelForUserSuccess = createAction('[Personal] Create User Wheel Success', props<{ wheels: WheelVersion[] }>());
export const createWheelForUserFailure = createAction('[Personal] Create User Wheel Failure', props<{ error: string }>());

export const createDefaultPersonalWheel = createAction('[Personal] Create Default Personal Wheel');

export const updatePersonalWheel = createAction(
  '[Personal] Update Personal Wheel',
  props<{ wheelId: string; updates: UpdateWheelDto; skipNotify?: boolean }>()
);
export const updatePersonalWheelSuccess = createAction('[Personal] Update Personal Wheel Success', props<{ wheels: WheelVersion[] }>());
export const updatePersonalWheelFailure = createAction('[Personal] Update Personal Wheel Failure', props<{ error: string }>());
export const switchPersonalWheel = createAction(
  '[Personal] Switch Personal Wheel',
  props<{ wheel: WheelVersion; shouldSaveSession?: boolean }>()
);

export const deletePersonalWheel = createAction('[Personal] Delete Personal Wheel', props<{ wheelId: string }>());
export const deletePersonalWheelSuccess = createAction('[Personal] Delete Personal Wheel Success', props<{ wheels: WheelVersion[] }>());
export const deletePersonalWheelFailure = createAction('[Personal] Delete Personal Wheel Failure', props<{ error: string }>());

export const loadClients = createAction('[Personal] Load Clients');
export const loadClientsSuccess = createAction('[Personal] Load Clients Success', props<{ clients: ParticipantOutputWithLinksDto[] }>());
export const loadClientsFailure = createAction('[Personal] Load Clients Failure', props<{ error: string }>());

export const createClient = createAction('[Personal] Create Clients', props<{ client: CreateParticipantDto }>());
export const createClientSuccess = createAction('[Personal] Create Clients Success', props<{ client: ParticipantOutputWithLinksDto }>());
export const createClientFailure = createAction('[Personal] Create Clients Failure', props<{ error: string }>());

export const updateClient = createAction('[Personal] Update Client', props<{ id: string; updates: CreateParticipantDto }>());
export const updateClientSuccess = createAction('[Personal] Update Client Success', props<{ client: ParticipantOutputWithLinksDto }>());
export const updateClientFailure = createAction('[Personal] Update Client Failure', props<{ error: string }>());

export const deleteClient = createAction('[Personal] Delete Client', props<{ id: string }>());
export const deleteClientSuccess = createAction('[Personal] Delete Client Success', props<{ id: string }>());
export const deleteClientFailure = createAction('[Personal] Delete Client Failure', props<{ error: string }>());

// brand
export const loadBrand = createAction('[Personal] Load Brand');
export const loadBrandSuccess = createAction('[Personal] Load Brand Success', props<{ brand: ProfessionalBrandOutputDto }>());
export const loadBrandFailure = createAction('[Personal] Load Brand Failure', props<{ error: string }>());

export const updateBrand = createAction('[Personal] Update Brand', props<{ brand: UpdateProfessionalBrandDto }>());
export const updateBrandSuccess = createAction('[Personal] Update Brand Success', props<{ brand: ProfessionalBrandOutputDto }>());
export const updateBrandFailure = createAction('[Personal] Update Brand Failure', props<{ error: string }>());

export const createBrand = createAction('[Personal] Create Brand', props<{ brand: CreateProfessionalBrandDto }>());
export const createBrandSuccess = createAction('[Personal] Create Brand Success', props<{ brand: ProfessionalBrandOutputDto }>());
export const createBrandFailure = createAction('[Personal] Create Brand Failure', props<{ error: string }>());

export const createLink = createAction(
  '[Personal] Create Link',
  props<{ participantId: string; link: CreateWheelLinkRequestDto; assignedWheels: string[] }>()
);
export const createLinkSuccess = createAction('[Personal] Create Link Success', props<{ link: WheelLink }>());
export const createLinkFailure = createAction('[Personal] Create Link Failure', props<{ error: string }>());

export const deleteLink = createAction('[Personal] Delete Link', props<{ id: string }>());
export const deleteLinkSuccess = createAction('[Personal] Delete Link Success', props<{ id: string }>());
export const deleteLinkFailure = createAction('[Personal] Delete Link Failure', props<{ error: string }>());

export const saveSession = createAction(
  '[Default Wheel] Session',
  props<{ activeWheel: SingleWheelState; session: CreateSessionDto; token?: string }>()
);
export const saveSessionSuccess = createAction('[Default Wheel] Save Session Success', props<{ sessions: WheelSessionOutputDto[] }>());
export const saveSessionFailure = createAction('[Default Wheel] Save Session Failure', props<{ error: string }>());

export const getUserSessions = createAction('[Default Wheel] Get Sessions');
export const getUserSessionsSuccess = createAction('[Default Wheel] Get Sessions Success', props<{ sessions: WheelSessionOutputDto[] }>());
export const getUserSessionsFailure = createAction('[Default Wheel] Get Sessions Failure', props<{ error: string }>());

export const getSessionsForParticipant = createAction('[Default Wheel] Get Sessions For Participant', props<{ token: string }>());
export const getSessionsForParticipantSuccess = createAction(
  '[Default Wheel] Get Sessions For Participant Success',
  props<{ sessions: WheelSessionOutputDto[] }>()
);
export const getSessionsForParticipantFailure = createAction(
  '[Default Wheel] Get Sessions For Participant Failure',
  props<{ error: string }>()
);

export const loadWheelForParticipant = createAction(
  '[Personal] Load User Wheel For Participant',
  props<{ wheelId: string; accountId: string }>()
);
export const loadWheelForParticipantSuccess = createAction('[Personal] Load User Wheel For Participant Success', props<{ wheel: WheelVersion }>());
export const loadWheelForParticipantFailure = createAction(
  '[Personal] Load User Wheel For Participant Failure',
  props<{ error: string }>()
);

export const getLinkDataByToken = createAction('[Default Wheel] Get Link Data', props<{ token: string }>());
export const getLinkDataByTokenSuccess = createAction('[Default Wheel] Get Link Data Success', props<{ data: ParticipantsWheelViewDto }>());
export const getLinkDataByTokenFailure = createAction('[Default Wheel] Get Link Data Failure', props<{ error: string }>());

export const getWheelVersionById = createAction('[Default Wheel] Get Wheel Version', props<{ id: string; sessionId: string }>());
export const getWheelVersionByIdSuccess = createAction('[Default Wheel] Get Wheel Version Success', props<{ wheel: SingleWheelState }>());
export const getWheelVersionByIdFailure = createAction('[Default Wheel] Get Wheel Version Failure', props<{ error: string }>());

export const setSessionDraftNote = createAction('[Wheel] Set Session Draft Note', props<{ noteMd: string }>());
export const clearSessionDraftNote = createAction('[Wheel] Clear Session Draft Note');

export const resetSession = createAction('[Wheel] Reset Session');

// Support Request Actions
export const submitSupportRequest = createAction('[Support] Submit Support Request', props<{ request: SupportRequest }>());
export const submitSupportRequestSuccess = createAction('[Support] Submit Support Request Success', props<{ ticketId?: string }>());
export const submitSupportRequestFailure = createAction('[Support] Submit Support Request Failure', props<{ error: string }>());

export const submitFeatureRequest = createAction('[Support] Submit Feature Request', props<{ request: FeatureRequestDto }>());
export const submitFeatureRequestSuccess = createAction('[Support] Feature Support Request Success');
export const submitFeatureRequestFailure = createAction('[Support] Feature Support Request Failure', props<{ error: string }>());

export const submitInquiryRequest = createAction('[Support] Submit Inquiry Request', props<{ request: InquiryDto }>());
export const submitInquirySuccess = createAction('[Support] Submit Inquiry Success');
export const submitInquiryFailure = createAction('[Support] Submit Inquiry Failure', props<{ error: string }>());
