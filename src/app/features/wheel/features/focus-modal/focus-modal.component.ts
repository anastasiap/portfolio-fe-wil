import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import {
  saveClientFocus,
  saveClientFocusForParticipant,
  selectActiveWheel,
  selectCategories,
  selectFocus,
  selectLinkData,
} from '../../../../state';
import { MatIcon } from '@angular/material/icon';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { GaEventsSource } from '../../../../services/analytics/analytics.service';
import { WheelStateCategory } from '../../../../state/typings';
import { FocusModalData } from '../action-buttons/typings';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'wil-focus-modal',
  standalone: true,
  imports: [AsyncPipe, MatIcon, CtaButtonComponent],
  templateUrl: './focus-modal.component.html',
  styleUrl: './focus-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusModalComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  private readonly dialogRef = inject(MatDialogRef<FocusModalComponent, string[]>);
  private readonly data = inject<FocusModalData>(MAT_DIALOG_DATA);

  public readonly categories$: Observable<WheelStateCategory[]> = this.store.select(selectCategories).pipe(startWith([]));
  public readonly categoriesLoading$: Observable<boolean> = this.store.select(selectActiveWheel).pipe(
    map((wheel) => Boolean(wheel?.loading)),
    startWith(false)
  );
  public readonly currentFocus$: Observable<string[]> = this.store.select(selectFocus);

  // State management
  private readonly initialFocus = signal<ReadonlySet<string>>(new Set());
  private readonly currentSelections = signal<ReadonlySet<string>>(new Set());

  private readonly source: GaEventsSource = this.data.source;
  private readonly wheelId = this.data.wheelId;

  ngOnInit(): void {
    this.currentFocus$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((focus) => {
      const focusSet = new Set(focus);

      this.initialFocus.set(focusSet);
      this.currentSelections.set(new Set(focusSet));
    });
  }

  public isSelected(categoryId: string): boolean {
    return this.currentSelections().has(categoryId);
  }

  public onSelectionChange(categoryId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const newSelections = new Set(this.currentSelections());

    if (checkbox.checked) {
      newSelections.add(categoryId);
    } else {
      newSelections.delete(categoryId);
    }

    this.currentSelections.set(newSelections);
  }

  public onSave(): void {
    const selectedIds = Array.from(this.currentSelections());

    this.store
      .select(selectLinkData)
      .pipe(take(1))
      .subscribe((data) => {
        if (data?.token) {
          this.store.dispatch(
            saveClientFocusForParticipant({
              newFocus: selectedIds,
              token: data?.token,
            })
          );

          return;
        }

        this.store.dispatch(
          saveClientFocus({
            wheelId: this.wheelId,
            newFocus: selectedIds,
            token: data?.token,
          })
        );
      });

    this.dialogRef.close(selectedIds);
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
