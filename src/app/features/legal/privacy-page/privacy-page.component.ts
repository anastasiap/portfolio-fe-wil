import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalDocPageComponent } from '../legal-doc-page/legal-doc-page.component';
import { LEGAL_DOCS } from '../legal-docs.constants';

/**
 * Privacy Policy page component
 * Thin wrapper around LegalDocPageComponent with Privacy-specific configuration
 */
@Component({
  selector: 'wil-privacy-page',
  standalone: true,
  imports: [LegalDocPageComponent],
  templateUrl: './privacy-page.component.html',
  styleUrl: './privacy-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPageComponent {
  public readonly config = LEGAL_DOCS.privacy;
}
