import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { NEW_WHEEL_NAME } from '../../features/wheel/features/wheel-name-form/wheel-name-form.component';
import { environment } from '../../../environments/environment';
import { WheelStateCategory } from '../../state/typings';

@Injectable({
  providedIn: 'root',
})
export class WheelsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  public fetchFreePlanDefaultTemplate(id: string): Observable<WheelTemplateDetailDto> {
    return this.http.get(`${this.baseUrl}/wheel-templates/${id}`).pipe(map((data) => data as WheelTemplateDetailDto));
  }

  public fetchWheelsTemplates(): Observable<WheelTemplateSummaryDto[]> {
    return this.http.get(`${this.baseUrl}/wheel-templates`).pipe(map((data) => data as WheelTemplateSummaryDto[]));
  }

  public fetchUserWheels(): Observable<WheelVersion[]> {
    return this.http
      .get(`${this.baseUrl}/wheel-versions/account/latest`)
      .pipe(map((data) => (data as WheelVersionOutputDto[]).map((w) => ({ ...w, id: w.wheelId, wheelVersionId: w.id }))));
  }

  public createWheel(): Observable<WheelVersion[]> {
    return this.http
      .post(`${this.baseUrl}/wheels`, { name: NEW_WHEEL_NAME, categoryIds: [], isDefault: true })
      .pipe(switchMap(() => this.fetchUserWheels()));
  }

  public updateWheel(wheelId: string, update: UpdateWheelDto): Observable<WheelVersion[]> {
    return this.http.patch(`${this.baseUrl}/wheels/${wheelId}`, update).pipe(switchMap(() => this.fetchUserWheels()));
  }

  public deleteWheel(id: string): Observable<WheelVersion[]> {
    return this.http.delete(`${this.baseUrl}/wheels/${id}`).pipe(switchMap(() => this.fetchUserWheels()));
  }

  public fetchLatestVersionByAccountId(wheelId: string, accountId: string): Observable<WheelVersion> {
    return this.http
      .get<WheelVersionOutputDto>(`${this.baseUrl}/wheel-versions/wheel/${wheelId}/latest/${accountId}`)
      .pipe(map((data) => ({ ...data, id: data.wheelId, wheelVersionId: data.id })));
  }

  public fetchWheelVersionById(id: string): Observable<WheelVersion> {
    return this.http
      .get<WheelVersionOutputDto>(`${this.baseUrl}/wheel-versions/${id}`)
      .pipe(map((data) => ({ ...data, id: data.wheelId, wheelVersionId: data.id })));
  }

  public fetchSessions(): Observable<WheelSessionOutputDto[]> {
    return this.http.get(`${this.baseUrl}/sessions`).pipe(map((data) => data as WheelSessionOutputDto[]));
  }

  public fetchSessionsForParticipant(token: string): Observable<WheelSessionOutputDto[]> {
    return this.http
      .get(`${this.baseUrl}/participants-wheel-view/wheel/${token}/sessions`)
      .pipe(map((data) => data as WheelSessionOutputDto[]));
  }

  public createSession(session: CreateSessionDto): Observable<WheelSessionOutputDto[]> {
    return this.http.post(`${this.baseUrl}/sessions`, session).pipe(switchMap(() => this.fetchSessions()));
  }

  public createSessionForParticipant(session: CreateSessionDto, token: string): Observable<never> {
    return this.http.post<never>(`${this.baseUrl}/participants-wheel-view/wheel/${token}/session`, session);
  }

  public createFocus(wheelId: string, focus: string[]): Observable<WheelFocusOutputDto> {
    return this.http.post<WheelFocusOutputDto>(`${this.baseUrl}/wheel-focus/${wheelId}`, { categoryIds: focus });
  }

  public createFocusForParticipant(focus: string[], token: string): Observable<WheelFocusOutputDto> {
    return this.http.post<WheelFocusOutputDto>(`${this.baseUrl}/participants-wheel-view/${token}/focus`, { categoryIds: focus });
  }

  public createCategory(category: { label: string; description: string; color: string }): Observable<WheelStateCategory> {
    return this.http.post<WheelStateCategory & { label: string }>(`${this.baseUrl}/wheel-categories`, category).pipe(
      map((data) => ({
        ...data,
        name: data.label,
        score: 0,
      }))
    );
  }

  public editCategory(id: string, category: { label: string; description: string; color: string }): Observable<WheelStateCategory> {
    return this.http.patch<WheelStateCategory & { label: string }>(`${this.baseUrl}/wheel-categories/${id}`, category).pipe(
      map((data) => ({
        ...data,
        name: data.label,
        score: 0,
      }))
    );
  }

  public deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wheel-categories/${id}`);
  }

  public deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${id}`);
  }

  public createDefaultWheel(id: string): Observable<WheelVersion[]> {
    return this.http.post(`${this.baseUrl}/wheel-templates/${id}/duplicate`, {}).pipe(switchMap(() => this.fetchUserWheels()));
  }
}
