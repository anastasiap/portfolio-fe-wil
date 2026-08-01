import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { EMPTY, map, of, withLatestFrom } from 'rxjs';
import {
  addCategory,
  addCategoryFailure,
  addCategorySuccess,
  createBrand,
  createBrandFailure,
  createBrandSuccess,
  createClient,
  createClientFailure,
  createClientSuccess,
  createDefaultPersonalWheel,
  createLink,
  createLinkFailure,
  createLinkSuccess,
  createWheelForUser,
  createWheelForUserFailure,
  createWheelForUserSuccess,
  deleteCategory,
  deleteCategoryFailure,
  deleteCategorySuccess,
  deleteClient,
  deleteClientFailure,
  deleteClientSuccess,
  deleteLink,
  deleteLinkFailure,
  deleteLinkSuccess,
  deletePersonalWheel,
  deletePersonalWheelFailure,
  deletePersonalWheelSuccess,
  deleteSession,
  deleteSessionFailure,
  deleteSessionSuccess,
  editCategory,
  editCategoryFailure,
  editCategorySuccess,
  getLinkDataByToken,
  getLinkDataByTokenFailure,
  getLinkDataByTokenSuccess,
  getSessionsForParticipant,
  getSessionsForParticipantFailure,
  getSessionsForParticipantSuccess,
  getUserSessions,
  getUserSessionsFailure,
  getUserSessionsSuccess,
  getWheelVersionById,
  getWheelVersionByIdFailure,
  getWheelVersionByIdSuccess,
  loadBrand,
  loadBrandFailure,
  loadBrandSuccess,
  loadClients,
  loadClientsFailure,
  loadClientsSuccess,
  loadDefaultTemplate,
  loadDefaultTemplateSuccess,
  loadUserWheels,
  loadUserWheelsFailure,
  loadUserWheelsSuccess,
  loadWheelForParticipant,
  loadWheelForParticipantFailure,
  loadWheelForParticipantSuccess,
  resetSession,
  resetUserWheels,
  saveClientFocus,
  saveClientFocusFailure,
  saveClientFocusForParticipant,
  saveClientFocusForParticipantFailure,
  saveClientFocusForParticipantSuccess,
  saveClientFocusSuccess,
  saveSession,
  saveSessionFailure,
  saveSessionSuccess,
  setActiveWheel,
  setActiveWheelFailure,
  submitFeatureRequest,
  submitFeatureRequestFailure,
  submitFeatureRequestSuccess,
  submitInquiryFailure,
  submitInquiryRequest,
  submitInquirySuccess,
  submitSupportRequest,
  submitSupportRequestFailure,
  submitSupportRequestSuccess,
  switchPersonalWheel,
  updateBrand,
  updateBrandFailure,
  updateBrandSuccess,
  updateClient,
  updateClientFailure,
  updateClientSuccess,
  updatePersonalWheel,
  updatePersonalWheelFailure,
  updatePersonalWheelSuccess,
  updateWheelOnSaveClientFocusSuccess,
} from './actions';
import { WheelsApiService } from '../services/api/wheels-api.service';
import { ProfessionalApiService } from '../services/api/professional-api.service';
import { SupportService } from '../services/api/support.service';
import wheelTemplateToState from '../utils/mappers/wheel-template-to-state';
import { Store } from '@ngrx/store';
import { selectActiveWheel, selectLang, selectSessions, selectUserWheels } from './selectors';
import { WheelStateCategory } from './typings';
import { mapActiveWheel, mapOutputToState } from '../utils/mappers/active-wheel.mapper';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../core/errors/app-error.model';
import { logoutCompleted } from './auth/auth.actions';
import { defaultWheelIdByLocale } from '../features/wheel/wheel.constants';
import { SessionSavedDialogComponent } from '../ui/dialogs/session-saved-dialog/session-saved-dialog.component';

@Injectable()
export class WheelEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private wheelsApiService = inject(WheelsApiService);
  private professionalApiService = inject(ProfessionalApiService);
  private readonly supportService = inject(SupportService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(Store);

  loadFreePlanDefaultTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDefaultTemplate),
      withLatestFrom(this.store.select(selectLang)),
      switchMap(([, locale = 'en']) => {
        const id = defaultWheelIdByLocale(locale);
        return this.wheelsApiService.fetchFreePlanDefaultTemplate(id).pipe(
          take(1),
          map((template) => {
            return loadDefaultTemplateSuccess({ wheel: wheelTemplateToState(template) });
          }),
          catchError(() =>
            this.http.get<Record<string, WheelStateCategory[]>>('assets/categories_wellbeing.json').pipe(
              map((categoriesByLocale) =>
                loadDefaultTemplateSuccess({
                  wheel: {
                    id,
                    categories: categoriesByLocale[locale] ?? categoriesByLocale['en'] ?? [],
                    name: 'Wellbeing',
                    descriptionKey: 0,
                    wheelKey: 0,
                    focus: [],
                    focusLoading: false,
                    loading: false,
                  },
                })
              ),
              catchError(() => EMPTY)
            )
          )
        );
      })
    )
  );

  // Personal Plan effects
  loadUserWheels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUserWheels),
      switchMap(() => {
        return this.wheelsApiService.fetchUserWheels().pipe(
          take(1),
          map((wheels) => loadUserWheelsSuccess({ wheels })),
          catchError((error) => {
            return of(
              loadUserWheelsFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  getWheelVersionById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getWheelVersionById),
      switchMap(({ id, sessionId }) => {
        return this.wheelsApiService.fetchWheelVersionById(id).pipe(
          withLatestFrom(this.store.select(selectSessions)),
          take(1),
          switchMap(([wheel, sessions]) => {
            const wheelSessions = sessions.filter((s) => s.wheelId === wheel.id);
            const session = wheelSessions.find((s) => s.id === sessionId);
            const mappedWheel = mapOutputToState(wheel, session);

            if (!mappedWheel) {
              return of(
                getWheelVersionByIdFailure({
                  error: 'Error loading user wheels',
                })
              );
            }

            return of(getWheelVersionByIdSuccess({ wheel: mappedWheel }));
          }),
          catchError((error) => {
            return of(
              getWheelVersionByIdFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  loadWheelByIdAndAccountId$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWheelForParticipant),
      switchMap(({ wheelId, accountId }) => {
        return this.wheelsApiService.fetchLatestVersionByAccountId(wheelId, accountId).pipe(
          take(1),
          map((wheel) => loadWheelForParticipantSuccess({ wheel })),
          catchError((error) => {
            return of(
              loadWheelForParticipantFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  createWheelForUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createWheelForUser),
      switchMap(() =>
        this.wheelsApiService.createWheel().pipe(
          take(1),
          map((wheels) => {
            this.notificationService.showSuccess('A wheel is successfully created!');
            return createWheelForUserSuccess({ wheels });
          }),
          catchError((error) => {
            console.log('Placeholder for signup');

            if (error?.status === 0 || error?.status >= 500) {
              this.notificationService.showError('Network error. Please check your connection and try again.');
            } else {
              this.notificationService.showError(
                error.message || 'Failed to create a wheel. If error persists, please contact support - test@example.com.'
              );
            }

            return of(
              createWheelForUserFailure({
                error: error ? error.message : 'Failed to create user wheel',
              })
            );
          })
        )
      )
    )
  );

  createDefaultWheelForUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createDefaultPersonalWheel),
      withLatestFrom(this.store.select(selectLang)),
      switchMap(([, locale]) => {
        const id = defaultWheelIdByLocale(locale);
        return this.wheelsApiService.createDefaultWheel(id).pipe(
          take(1),
          map((wheels) => {
            return createWheelForUserSuccess({ wheels });
          }),
          catchError((error: AppError) => {
            this.notificationService.showError(error.message);

            console.log('Placeholder for signup');
            return of(
              createWheelForUserFailure({
                error: error.message,
              })
            );
          })
        );
      })
    )
  );

  updatePersonalWheel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(updatePersonalWheel),
      switchMap(({ wheelId, updates, skipNotify }) => {
        const categoryIds = updates.categoryIds?.map((category) => category) || [];

        return this.wheelsApiService.updateWheel(wheelId, { name: updates.name, categoryIds, isDefault: updates.isDefault }).pipe(
          take(1),
          map((wheels) => {
            if (!skipNotify) {
              this.notificationService.showSuccess(`${updates.name} is successfully updated.`);
            }

            return updatePersonalWheelSuccess({ wheels });
          }),
          catchError((error) => {
            if (!skipNotify) {
              this.notificationService.showError(error.message);
            }

            return of(
              updatePersonalWheelFailure({
                error: error?.error ? error.error.message : 'Failed to update personal wheel',
              })
            );
          })
        );
      })
    );
  });

  switchPersonalWheel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(switchPersonalWheel),
      withLatestFrom(this.store.select(selectActiveWheel), this.store.select(selectUserWheels)),
      switchMap(([{ wheel, shouldSaveSession }, activeWheel, wheels]) => {
        const switchWheelAction = updatePersonalWheel({
          wheelId: wheel.id,
          updates: {
            name: wheel.name,
            isDefault: true,
            categoryIds: wheel.categorySnapshots.map((category) => category.categoryId),
          },
          skipNotify: true,
        });

        if (!shouldSaveSession || !activeWheel) {
          return of(switchWheelAction);
        }

        const userWheel = wheels.find((item) => item.id === activeWheel.id);
        if (!userWheel) {
          return of(switchWheelAction);
        }

        const session = {
          wheelId: userWheel.id,
          wheelVersionId: userWheel.wheelVersionId,
          scores: activeWheel.categories.map((category) => ({
            categoryId: category.id,
            value: category.score,
          })),
          focusAtSubmit: activeWheel.focus,
          locale: 'en',
        };

        return of(saveSession({ activeWheel, session }), switchWheelAction);
      })
    );
  });

  deletePersonalWheel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(deletePersonalWheel),
      switchMap(({ wheelId }) => {
        return this.wheelsApiService.deleteWheel(wheelId).pipe(
          take(1),
          map((wheels) => deletePersonalWheelSuccess({ wheels })),
          catchError((error) =>
            of(
              deletePersonalWheelFailure({
                error: error?.error ? error.error.message : 'Failed to delete a wheel',
              })
            )
          )
        );
      })
    );
  });

  setActiveWheel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(deletePersonalWheelSuccess),
      withLatestFrom(this.store.select(selectUserWheels)),
      switchMap(([, wheels]) => {
        const wheel = mapActiveWheel(wheels);

        if (!wheel) {
          return of(setActiveWheelFailure());
        }

        return of(setActiveWheel({ wheel: wheel }));
      }),
      catchError(() => {
        return of(setActiveWheelFailure());
      })
    );
  });

  addCategory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(addCategory),
      switchMap(({ color }) =>
        this.wheelsApiService
          .createCategory({
            label: 'New Category',
            color,
            description: '',
          })
          .pipe(
            take(1),
            map((category) => addCategorySuccess({ category })),
            catchError((error) =>
              of(
                addCategoryFailure({
                  error: error?.error ? error.error.message : 'Failed to create category',
                })
              )
            )
          )
      )
    );
  });

  editCategory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(editCategory),
      switchMap((category) =>
        this.wheelsApiService
          .editCategory(category.categoryId, {
            label: category.label,
            color: category.color,
            description: category.description,
          })
          .pipe(
            take(1),
            map((data) => editCategorySuccess({ category: data })),
            catchError((error) =>
              of(
                editCategoryFailure({
                  error: error?.error ? error.error.message : 'Failed to create category',
                })
              )
            )
          )
      )
    );
  });

  deleteCategory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(deleteCategory),
      switchMap(({ id }) =>
        this.wheelsApiService.deleteCategory(id).pipe(
          take(1),
          map(() => deleteCategorySuccess({ id })),
          catchError((error) =>
            of(
              deleteCategoryFailure({
                error: error?.error ? error.error.message : 'Failed to create category',
              })
            )
          )
        )
      )
    );
  });

  // Professional Plan effects
  loadClients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadClients),
      switchMap(() => {
        return this.professionalApiService.fetchClients().pipe(
          take(1),
          map((clients) => loadClientsSuccess({ clients })),
          catchError((error) => {
            return of(
              loadClientsFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  createClient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createClient),
      switchMap(({ client }) => {
        return this.professionalApiService.createClient(client).pipe(
          take(1),
          map((client) => createClientSuccess({ client })),
          catchError((error) => {
            return of(
              createClientFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  updateClient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateClient),
      switchMap(({ id, updates }) => {
        return this.professionalApiService.updateClient(id, updates).pipe(
          take(1),
          map((client) => updateClientSuccess({ client })),
          catchError((error) => {
            return of(
              updateClientFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  deleteClient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteClient),
      switchMap(({ id }) => {
        return this.professionalApiService.deleteClient(id).pipe(
          take(1),
          map(() => deleteClientSuccess({ id })),
          catchError((error) => {
            return of(
              deleteClientFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  loadBrand$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBrand),
      switchMap(() => {
        return this.professionalApiService.fetchBrand().pipe(
          take(1),
          map((brand) => loadBrandSuccess({ brand })),
          catchError((error) => {
            return of(
              loadBrandFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  createBrand$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(createBrand),
      switchMap(({ brand }) => {
        return this.professionalApiService.createBrand(brand).pipe(
          take(1),
          map((brand) => createBrandSuccess({ brand })),
          catchError((error) => {
            return of(
              createBrandFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    );
  });

  updateBrand$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(updateBrand),
      switchMap(({ brand }) => {
        return this.professionalApiService.updateBrand(brand).pipe(
          take(1),
          map((brand) => updateBrandSuccess({ brand })),
          catchError((error) => {
            return of(
              updateBrandFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    );
  });

  createLink$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(createLink),
      switchMap(({ participantId, link }) => {
        return this.professionalApiService.createLink(participantId, link).pipe(
          take(1),
          map((link) => createLinkSuccess({ link })),
          catchError((error) => {
            return of(
              createLinkFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    );
  });

  deleteLink$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(deleteLink),
      switchMap(({ id }) => {
        return this.professionalApiService.deleteLink(id).pipe(
          take(1),
          map(() => deleteLinkSuccess({ id })),
          catchError((error) => {
            return of(
              deleteLinkFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    );
  });

  assignWheel$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(createLink),
      switchMap(({ participantId, assignedWheels }) => {
        return this.professionalApiService.updateClient(participantId, { assignedWheels }).pipe(
          take(1),
          map((client) => updateClientSuccess({ client })),
          catchError((error) => {
            return of(
              createLinkFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    );
  });

  saveClientFocus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveClientFocus),
      filter(({ token }) => !token),
      switchMap(({ wheelId, newFocus }) => {
        return this.wheelsApiService.createFocus(wheelId, newFocus).pipe(
          take(1),
          map((data) => {
            this.notificationService.showSuccess(`Focus saved.`);
            return saveClientFocusSuccess({ focus: data.categoryIds, wheelId });
          }),
          catchError((error) => {
            this.notificationService.showError(`Error saving focus. Please, try again.`);
            return of(
              saveClientFocusFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            );
          })
        );
      })
    )
  );

  saveClientFocusForParticipant$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveClientFocusForParticipant),
      filter(({ token }) => Boolean(token)),
      switchMap(({ newFocus, token }) => {
        return this.wheelsApiService.createFocusForParticipant(newFocus, token).pipe(
          take(1),
          map((data) => saveClientFocusForParticipantSuccess({ focus: data.categoryIds })),
          catchError((error) =>
            of(
              saveClientFocusForParticipantFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            )
          )
        );
      })
    )
  );

  saveClientFocusSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveClientFocusSuccess),
      switchMap(({ wheelId }) => {
        return this.wheelsApiService.updateWheel(wheelId, {}).pipe(
          take(1),
          map(() => updateWheelOnSaveClientFocusSuccess()),
          catchError((error) =>
            of(
              saveClientFocusFailure({
                error: error?.message ?? 'Error loading user wheels',
              })
            )
          )
        );
      })
    )
  );

  saveSession$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(saveSession),
      switchMap(({ activeWheel, session, token }) => {
        const sessionOutput: CreateSessionDto = {
          wheelId: activeWheel.id,
          wheelVersionId: session.wheelVersionId,
          scores: session.scores,
          focusAtSubmit: activeWheel.focus || [],
          locale: 'en',
          notes: activeWheel.sessionDraft?.noteMd,
        };

        if (token) {
          return this.wheelsApiService.createSessionForParticipant(sessionOutput, token);
        }

        return this.wheelsApiService.createSession(sessionOutput).pipe(
          take(1),
          map((sessions) => {
            this.notificationService.showSuccess(`Session saved.`);
            return saveSessionSuccess({ sessions });
          }),
          catchError((error) => {
            this.notificationService.showError(error.message || `Error saving session.`);
            return of(
              saveSessionFailure({
                error: error?.message ?? 'Error saving session',
              })
            );
          })
        );
      })
    );
  });

  reloadSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveSessionSuccess),
      map(({ sessions }) => getUserSessionsSuccess({ sessions }))
    )
  );

  resetSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveSessionSuccess),
      map(() => resetSession())
    )
  );

  showSessionSavedDialog$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(saveSessionSuccess),
        tap(() => {
          const successDialogData: SessionSavedDialogData = {
            autoCloseTimeSeconds: 5,
          };

          this.dialog.open(SessionSavedDialogComponent, {
            data: successDialogData,
            width: '450px',
            disableClose: false,
          });
        })
      ),
    { dispatch: false }
  );

  clearUserWheel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logoutCompleted),
      map(() => resetUserWheels())
    )
  );

  getSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getUserSessions),
      switchMap(() => {
        return this.wheelsApiService.fetchSessions().pipe(
          take(1),
          map((sessions) => getUserSessionsSuccess({ sessions })),
          catchError((error) =>
            of(
              getUserSessionsFailure({
                error: error?.message ?? 'Error loading user link data',
              })
            )
          )
        );
      })
    )
  );

  deleteSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteSession),
      switchMap(({ id }) => {
        return this.wheelsApiService.deleteSession(id).pipe(
          take(1),
          map(() => {
            this.notificationService.showSuccess('Session is deleted successfully.');
            return deleteSessionSuccess({ id });
          }),
          catchError((error) => {
            this.notificationService.showError('Error deleting session. Please try again later.');
            return of(
              deleteSessionFailure({
                error: error?.message ?? 'Error deleting session',
              })
            );
          })
        );
      })
    )
  );

  getSessionsForParticipant$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getSessionsForParticipant),
      switchMap(({ token }) => {
        return this.wheelsApiService.fetchSessionsForParticipant(token).pipe(
          take(1),
          map((sessions) => getSessionsForParticipantSuccess({ sessions })),
          catchError((error) => {
            return of(
              getSessionsForParticipantFailure({
                error: error?.message ?? 'Error loading user link data',
              })
            );
          })
        );
      })
    )
  );

  getLinkData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getLinkDataByToken),
      switchMap(({ token }) => {
        return this.professionalApiService.fetchLinkData(token).pipe(
          take(1),
          map((data) => getLinkDataByTokenSuccess({ data })),
          catchError((error) => {
            return of(
              getLinkDataByTokenFailure({
                error: error?.message ?? 'Error loading user link data',
              })
            );
          })
        );
      })
    )
  );

  submitSupportRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(submitSupportRequest),
      switchMap(({ request }) => {
        return this.supportService.submitSupportRequest(request).pipe(
          map((response) => {
            this.notificationService.showSuccess("Message sent successfully. We'll get back to you as soon as possible.");
            return submitSupportRequestSuccess({ ticketId: response.ticketId });
          }),
          catchError((error: AppError) => {
            this.notificationService.showError('Could not send your message. Please try again or email us directly.');
            return of(submitSupportRequestFailure({ error: error.message }));
          })
        );
      })
    )
  );

  submitInquiryRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(submitInquiryRequest),
      switchMap(({ request }) => {
        return this.supportService.submitWhiteLabelRequest(request).pipe(
          map(() => {
            this.notificationService.showSuccess("Message sent successfully. We'll get back to you as soon as possible.");
            return submitInquirySuccess();
          }),
          catchError((error: AppError) => {
            this.notificationService.showError('Could not send your message. Please try again or email us directly.');
            return of(submitInquiryFailure({ error: error.message }));
          })
        );
      })
    )
  );

  submitFeatureRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(submitFeatureRequest),
      switchMap(({ request }) => {
        return this.supportService.submitFeatureRequest(request).pipe(
          map(() => {
            this.notificationService.showSuccess("Message sent successfully. We'll get back to you as soon as possible.");
            return submitFeatureRequestSuccess();
          }),
          catchError((error: AppError) => {
            this.notificationService.showError('Could not send your message. Please try again or email us directly.');
            return of(submitFeatureRequestFailure({ error: error.message }));
          })
        );
      })
    )
  );
}
