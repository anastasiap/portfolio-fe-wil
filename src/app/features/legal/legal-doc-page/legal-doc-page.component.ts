import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownModule } from 'ngx-markdown';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Shared component for rendering legal documents from Markdown files
 * Handles loading, error states, and consistent Material Design layout
 */
@Component({
  selector: 'wil-legal-doc-page',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule, MatButtonModule, MatIconModule, MarkdownModule],
  templateUrl: './legal-doc-page.component.html',
  styleUrl: './legal-doc-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalDocPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  public readonly title = input.required<string>();
  public readonly assetPath = input.required<string>();
  public readonly lastUpdated = input<string | null>(null);
  public readonly pageTitle = input.required<string>();

  public readonly content = signal('');
  public readonly isLoading = signal(true);
  public readonly hasError = signal(false);
  public readonly errorMessage = signal('');

  ngOnInit(): void {
    // Set the document title
    this.titleService.setTitle(this.pageTitle());

    // Load the markdown content
    this.loadContent();
  }

  public onReload(): void {
    this.hasError.set(false);
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.loadContent();
  }

  private loadContent(): void {
    this.http
      .get(this.assetPath(), { responseType: 'text' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (markdown) => {
          this.content.set(markdown);
          this.isLoading.set(false);
          this.hasError.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set('Document unavailable');
        },
      });
  }
}
