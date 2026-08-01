import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DonateComponent } from '../../ui/donate/donate.component';
import { WheelComponent } from '../wheel/wheel.component';
import { SeoService } from '../../services/seo/seo.service';
import { Store } from '@ngrx/store';
import { loadWheelsTemplates } from '../../state';
import { CtaButtonComponent } from '../../ui/cta-button/cta-button.component';
import { PersonalPlanFeaturePromotionComponent } from './ui/personal-plan-feature-promotion/personal-plan-feature-promotion.component';

@Component({
  selector: 'wil-home',
  standalone: true,
  imports: [DonateComponent, WheelComponent, CtaButtonComponent, PersonalPlanFeaturePromotionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    const { title, description } = this.route.snapshot.data;
    this.seoService.updateSeoTags({
      title,
      description,
    });

    this.store.dispatch(loadWheelsTemplates());
  }
}
