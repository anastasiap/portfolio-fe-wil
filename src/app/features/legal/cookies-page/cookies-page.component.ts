import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalDocPageComponent } from '../legal-doc-page/legal-doc-page.component';
import { LEGAL_DOCS } from '../legal-docs.constants';

@Component({
  selector: 'wil-cookies-page',
  standalone: true,
  imports: [LegalDocPageComponent],
  templateUrl: './cookies-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesPageComponent {
  public readonly config = LEGAL_DOCS.cookies;
}
