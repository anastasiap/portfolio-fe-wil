import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../services/seo/seo.service';

@Component({
  selector: 'wil-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class NotFoundComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    const routeData = this.route.snapshot.data;
    this.seoService.updateSeoTags({
      title: routeData['title'],
      description: routeData['description'],
    });
  }
}
