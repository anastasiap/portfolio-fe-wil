import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class CustomTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly defaultSiteName = 'Wheel of Life';
  private readonly siteSuffix = ' | Wheel of Life';

  updateTitle(routerState: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(routerState);
    
    if (routeTitle) {
      // If route has a title, append site suffix
      this.title.setTitle(routeTitle + this.siteSuffix);
    } else {
      // Fallback to default site name
      this.title.setTitle(this.defaultSiteName + ': free customizable online tool');
    }
  }

  override buildTitle(routerState: RouterStateSnapshot): string | undefined {
    let route = routerState.root;
    let title: string | undefined;

    // Traverse the route tree to find the deepest route with a title
    while (route) {
      if (route.data?.['title']) {
        title = route.data['title'];
      }
      if (route.firstChild) {
        route = route.firstChild;
      } else {
        break;
      }
    }

    return title;
  }
}