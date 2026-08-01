import { Component, computed, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../../../../../services/analytics/analytics.service';
import { WheelStateCategory } from '../../../../../../state/typings';
import { DownloadImageModalData, DownloadModalState } from '../../typings';
import { CtaButtonComponent } from '../../../../../../ui/cta-button/cta-button.component';

@Component({
  selector: 'wil-download-image-modal',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIcon, MatProgressSpinner, CtaButtonComponent],
  templateUrl: './download-image-modal.component.html',
  styleUrl: './download-image-modal.component.scss',
})
export class DownloadImageModalComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly dialogRef = inject(MatDialogRef<DownloadImageModalComponent>, { optional: true });
  private readonly dialogData = inject<DownloadImageModalData | null>(MAT_DIALOG_DATA, { optional: true });

  public readonly downloadModalState = input<DownloadModalState | null>(null);
  public readonly categories = input<WheelStateCategory[] | null>(null);

  public readonly changeDownloadMode = output<DownloadModalState | null>();

  public downloadModalTitle = signal<string>('Downloading your image');
  private readonly internalDownloadModalState = signal<DownloadModalState>('loading');
  public readonly currentDownloadModalState = computed(() => this.downloadModalState() ?? this.internalDownloadModalState());
  public readonly currentCategories = computed(() => this.categories() ?? this.dialogData?.categories ?? null);

  private downloadModalTimeout: ReturnType<typeof setTimeout> | null = null;
  private hasTrackedModalOpened = false;
  private hasTrackedPreviewShown = false;

  ngOnInit(): void {
    // Track analytics event (prevent duplicates)
    if (!this.hasTrackedModalOpened) {
      this.analytics.track('download_modal_opened', {
        source: 'action_buttons',
      });
      this.hasTrackedModalOpened = true;
    }

    // Open modal in loading state
    this.internalDownloadModalState.set('loading');
    this.changeDownloadMode.emit('loading');
    this.downloadModalTitle.set('Downloading your image');

    // Set timeout to transition to preview state (1500-2500ms)
    this.downloadModalTimeout = setTimeout(() => {
      this.internalDownloadModalState.set('preview');
      this.changeDownloadMode.emit('preview');
      this.downloadModalTitle.set('Future insight preview');

      // Track preview shown event (prevent duplicates)
      if (!this.hasTrackedPreviewShown) {
        this.analytics.track('download_preview_shown', {
          source: 'action_buttons',
        });
        this.hasTrackedPreviewShown = true;
      }
    }, 2000); // 2000ms is in the middle of the requested range
  }

  ngOnDestroy(): void {
    this.cleanupDownloadTimeout();
    // Reset analytics tracking flags
    this.hasTrackedModalOpened = false;
    this.hasTrackedPreviewShown = false;
  }

  public closeDownloadModal(): void {
    this.cleanupDownloadTimeout();

    this.changeDownloadMode.emit(null);
    this.dialogRef?.close();

    // Reset analytics tracking flags
    this.hasTrackedModalOpened = false;
    this.hasTrackedPreviewShown = false;
  }

  public navigateToPersonalPlan(): void {
    // Track CTA click event
    this.analytics.track('start_tracking_clicked', {
      source: 'download_modal',
      cta_location: 'conversion_section',
    });

    this.router.navigate(['/register-free-account']);
    this.closeDownloadModal();
  }

  private cleanupDownloadTimeout(): void {
    if (this.downloadModalTimeout) {
      clearTimeout(this.downloadModalTimeout);
      this.downloadModalTimeout = null;
    }
  }

  public trackByCategory(index: number, category: WheelStateCategory): string {
    return category.id;
  }
}
