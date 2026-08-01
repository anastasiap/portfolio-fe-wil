import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { WhiteLabelFormComponent } from './features/white-label-form.component';

import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';
import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'wil-landing-coaches',
  standalone: true,
  imports: [FlexLayoutModule, CtaButtonComponent],
  templateUrl: './landing-coaches.component.html',
  styleUrl: './landing-coaches.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingCoachesComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    const routeData = this.route.snapshot.data;
    this.seoService.updateSeoTags({
      title: routeData['title'],
      description: routeData['description'],
    });
  }

  public openApplyModal(): void {
    this.dialog.open(WhiteLabelFormComponent, {
      width: '500px',
      autoFocus: true,
      role: 'dialog',
      data: {},
      panelClass: 'modal-panel',
    });
  }
}
