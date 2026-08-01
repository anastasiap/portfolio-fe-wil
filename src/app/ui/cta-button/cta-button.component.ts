import { Component, EventEmitter, input, Output } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';


@Component({
  selector: 'wil-cta-button',
  standalone: true,
  imports: [MatProgressSpinner],
  templateUrl: './cta-button.component.html',
  styleUrl: './cta-button.component.scss',
})
export class CtaButtonComponent {
  public readonly disabled = input<boolean>(false);
  public readonly loading = input<boolean>(false);
  public readonly ctaText = input.required<string>();
  public readonly style = input.required<'primary' | 'secondary' | 'warn'>();
  public readonly size = input.required<'small' | 'large' | 'full'>();

  @Output() public readonly ctaClick = new EventEmitter<void>();
}
