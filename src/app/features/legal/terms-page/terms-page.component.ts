import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalDocPageComponent } from '../legal-doc-page/legal-doc-page.component';
import { LEGAL_DOCS } from '../legal-docs.constants';

/**
 * Terms of Service page component
 * Thin wrapper around LegalDocPageComponent with Terms-specific configuration
 */
@Component({
  selector: 'wil-terms-page',
  standalone: true,
  imports: [LegalDocPageComponent],
  templateUrl: './terms-page.component.html',
  styleUrl: './terms-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPageComponent {
  public readonly config = LEGAL_DOCS.terms;
}
