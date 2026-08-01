import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createDefaultPersonalWheel, createWheelForUser } from '../../../../state';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { NEW_WHEEL_NAME } from '../../features/wheel-name-form/wheel-name-form.component';

@Component({
  selector: 'wil-empty-state',
  standalone: true,
  imports: [MatIcon, TranslatePipe],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  public readonly onNewClick$ = new Subject<void>();
  public readonly onDefaultClick$ = new Subject<void>();

  ngOnInit(): void {
    this.onDefaultClick$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.store.dispatch(createDefaultPersonalWheel());
    });

    this.onNewClick$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.store.dispatch(
        createWheelForUser({
          name: NEW_WHEEL_NAME,
          categoryIds: [],
          isDefault: true,
        })
      );
    });
  }
}
