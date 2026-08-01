
import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { initializePaypal } from '../../services/paypal.service';
import { DonateComponent } from '../../ui/donate/donate.component';
import { SeoService } from '../../services/seo/seo.service';
import { setEmail } from '../../utils/set-email.util';

@Component({
  selector: 'wil-about-me',
  standalone: true,
  imports: [MatButtonModule, FlexLayoutModule, DonateComponent],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);

  public ngOnInit(): void {
    const routeData = this.route.snapshot.data;
    this.seoService.updateSeoTags({
      title: routeData['title'],
      description: routeData['description'],
    });

    setEmail(this.platformId);
    initializePaypal('#about-me-donate-button', this.platformId);
  }
}
