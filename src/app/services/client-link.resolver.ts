import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { getLinkDataByToken } from '../state';
import { filter } from 'rxjs/operators';
import { ProfessionalApiService } from './api/professional-api.service';

export interface ClientLinkData {
  readonly accountId: string;
  readonly client: {
    readonly id: string;
    readonly name: string;
  };
  readonly coach: {
    readonly id?: string;
    readonly brand?: {
      readonly logoUrl?: string;
      readonly primaryColor?: string;
    };
  };
  readonly wheel: {
    readonly activeVersionId: string;
    readonly name: string;
  };
  readonly wheelVersion: {
    readonly categoryIds: string[];
    readonly categories: CategorySnapshot[];
  };
  readonly wheelId: string;
  readonly focusIds?: ParticipantsWheelViewCurrentFocusDto;
}

@Injectable({
  providedIn: 'root',
})
export class ClientLinkResolverService {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly professionalApiService = inject(ProfessionalApiService);

  public resolve(route: ActivatedRouteSnapshot): Observable<ClientLinkData | null> {
    const token = route.paramMap.get('linkId');

    if (!token) {
      this.navigateToNotFound();
      return of(null);
    }

    this.store.dispatch(getLinkDataByToken({ token }));

    return this.professionalApiService.fetchLinkData(token).pipe(
      filter((data) => Boolean(data)),
      map((data) => {
        return {
          accountId: data!.user!.accountId,
          client: {
            id: data!.participant!.id,
            name: data!.participant!.name,
          },
          coach: {
            id: data!.user?.id,
            brand: {
              logoUrl: data!.brand?.logoUrl,
              primaryColor: data!.brand?.primaryColor,
            },
          },
          wheel: {
            activeVersionId: data!.wheel!.versionId,
            name: data!.wheel!.name,
          },
          wheelVersion: {
            categoryIds: data!.wheel!.categories.map((category) => category.categoryId),
            categories: data!.wheel!.categories,
          },
          wheelId: data!.wheel!.id,
          wheelVersionId: data!.wheel?.versionId,
          focusIds: data!.currentFocus,
        };
      }),
      catchError(() => {
        this.navigateToNotFound();
        return of(null);
      })
    );
  }

  private navigateToNotFound(): void {
    this.router.navigate(['/client-link-not-found'], {
      skipLocationChange: false,
      replaceUrl: true,
    });
  }
}

// Create the resolver function
export const clientLinkResolver: ResolveFn<ClientLinkData | null> = (route: ActivatedRouteSnapshot) => {
  const resolver = inject(ClientLinkResolverService);
  return resolver.resolve(route);
};
