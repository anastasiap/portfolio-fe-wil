import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  public fetchClients(): Observable<ParticipantOutputWithLinksDto[]> {
    return this.http.get(`${this.baseUrl}/participants`).pipe(map((data) => data as ParticipantOutputWithLinksDto[]));
  }

  public createClient(participant: CreateParticipantDto): Observable<ParticipantOutputWithLinksDto> {
    return this.http.post<ParticipantOutputWithLinksDto>(`${this.baseUrl}/participants`, participant);
  }

  public updateClient(participantId: string, client: UpdateParticipantDto): Observable<ParticipantOutputWithLinksDto> {
    return this.http.patch<ParticipantOutputWithLinksDto>(`${this.baseUrl}/participants/${participantId}`, client);
  }

  public deleteClient(participantId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/participants/${participantId}`);
  }

  public fetchBrand(): Observable<ProfessionalBrandOutputDto> {
    return this.http.get(`${this.baseUrl}/professional-brand`).pipe(map((data) => data as ProfessionalBrandOutputDto));
  }

  public updateBrand(brand: UpdateProfessionalBrandDto): Observable<ProfessionalBrandOutputDto> {
    return this.http.patch(`${this.baseUrl}/professional-brand`, brand).pipe(map((data) => data as ProfessionalBrandOutputDto));
  }

  public createBrand(brand: CreateProfessionalBrandDto): Observable<ProfessionalBrandOutputDto> {
    return this.http.post(`${this.baseUrl}/professional-brand`, brand).pipe(map((data) => data as ProfessionalBrandOutputDto));
  }

  public createLink(participantId: string, link: CreateWheelLinkRequestDto): Observable<WheelLink> {
    return this.http.post(`${this.baseUrl}/wheel-links/participants/${participantId}/links`, link).pipe(map((data) => data as WheelLink));
  }

  public deleteLink(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wheel-links/${id}`);
  }

  public fetchLinkData(token: string): Observable<ParticipantsWheelViewDto> {
    return this.http.get(`${this.baseUrl}/participants-wheel-view/wheel/${token}`).pipe(
      map(
        (data) =>
          ({
            ...data,
            token,
          } as ParticipantsWheelViewDto)
      )
    );
  }
}
