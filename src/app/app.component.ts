import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { HeaderComponent } from './features/header/header.component';
import { FooterComponent } from './ui/footer/footer.component';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';

import { map, Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouteData } from '../configs/routes.config';

@Component({
  selector: 'wil-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  public showHeader = true;
  public showFooter = true;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => this.getLeafRoute(route)),
        switchMap((route) => route.data as Observable<RouteData>),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        this.showHeader = !data.hideHeader;
        this.showFooter = !data.hideFooter;
      });
  }

  private getLeafRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }

    return route;
  }
}
