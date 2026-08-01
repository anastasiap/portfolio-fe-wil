import { AfterViewInit, ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { initializePaypal } from '../../services/paypal.service';

@Component({
  selector: 'wil-donate',
  standalone: true,
  imports: [FlexLayoutModule],
  templateUrl: './donate.component.html',
  styleUrl: './donate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonateComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    initializePaypal('#home-donate-button', this.platformId);
  }
}
