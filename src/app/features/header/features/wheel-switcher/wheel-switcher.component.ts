import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SingleWheelState } from '../../../../state/typings';
import {
  selectActiveWheel,
  selectHasAllScores,
  selectUserWheels,
  setActiveWheel,
  switchPersonalWheel,
} from '../../../../state';
import { mapActiveWheel } from '../../../../utils/mappers/active-wheel.mapper';
import { UnsavedChangesDialogComponent } from '../../../../ui/dialogs/unsaved-changes-dialog.component';

interface WheelSwitcherViewModel {
  currentWheel: SingleWheelState | null;
  availableWheels: WheelVersion[];
  currentWheelId: string | null;
  displayTitle: string;
  hasMultipleWheels: boolean;
}

@Component({
  selector: 'wil-wheel-switcher',
  standalone: true,
  imports: [MatSelectModule, MatTooltipModule, MatDialogModule],
  templateUrl: './wheel-switcher.component.html',
  styleUrl: './wheel-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WheelSwitcherComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  private readonly activeWheel = toSignal(this.store.select(selectActiveWheel), { initialValue: null });
  private readonly userWheels = toSignal(this.store.select(selectUserWheels), { initialValue: [] });
  private readonly hasUnsavedChanges = toSignal(this.store.select(selectHasAllScores), { initialValue: false });

  public readonly pendingWheelSwitch = signal<WheelVersion | null>(null);

  public readonly vm = computed<WheelSwitcherViewModel>(() => {
    const currentWheel = this.activeWheel();
    const availableWheels = this.userWheels();
    const title = currentWheel?.name ?? '';

    return {
      currentWheel,
      availableWheels,
      currentWheelId: currentWheel?.id ?? null,
      displayTitle: title.length > 60 ? title.substring(0, 60) + '...' : title,
      hasMultipleWheels: availableWheels.length > 1,
    };
  });

  constructor() {
    effect(
      () => {
        const { currentWheel, availableWheels } = this.vm();

        if (currentWheel || !availableWheels.length) {
          return;
        }

        const mappedWheel = mapActiveWheel(availableWheels);
        if (mappedWheel) {
          this.store.dispatch(setActiveWheel({ wheel: mappedWheel }));
        }
      },
      { allowSignalWrites: true }
    );
  }

  public onWheelSelectionChange(event: MatSelectChange): void {
    const selectedWheelId = event.value as string;
    const { availableWheels, currentWheelId } = this.vm();
    const selectedWheel = availableWheels.find((wheel) => wheel.id === selectedWheelId);

    if (!selectedWheel || selectedWheelId === currentWheelId) {
      return; // Don't switch to same wheel or invalid wheel
    }

    if (this.hasUnsavedChanges()) {
      this.pendingWheelSwitch.set(selectedWheel);
      this.showUnsavedChangesDialog();
    } else {
      this.switchToWheel(selectedWheel);
    }
  }

  private showUnsavedChangesDialog(): void {
    const dialogRef = this.dialog.open(UnsavedChangesDialogComponent, {
      width: '530px',
      disableClose: true,
      data: {},
      panelClass: 'modal-panel',
    });

    dialogRef.afterClosed().subscribe((result: UnsavedChangesDialogResult) => {
      if (result?.action === 'save') {
        this.confirmSwitch(true);
      } else if (result?.action === 'discard') {
        this.confirmSwitch();
      } else {
        // Cancel - reset the select to current wheel
        this.pendingWheelSwitch.set(null);
      }
    });
  }

  private confirmSwitch(save?: boolean): void {
    const wheelToSwitch = this.pendingWheelSwitch();
    if (wheelToSwitch) {
      this.switchToWheel(wheelToSwitch, save);
    }
    this.pendingWheelSwitch.set(null);
  }

  private switchToWheel(wheel: WheelVersion, shouldSaveSession?: boolean): void {
    this.store.dispatch(switchPersonalWheel({ wheel, shouldSaveSession }));
  }
}
