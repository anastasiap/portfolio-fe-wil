import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryComponent } from './features/category/category.component';
import { ActionButtonsComponent } from './features/action-buttons/action-buttons.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CanvasComponent } from './features/canvas/canvas.component';
import { map, Observable, Subject, withLatestFrom } from 'rxjs';
import {
  initializeWheel,
  loadDefaultTemplate,
  selectCategories,
  selectHasAllScores,
  selectHasUnsavedCategoriesChanges,
  selectLang,
  selectMode,
  selectUserWheels,
  setActiveWheel,
  updatePersonalWheel,
} from '../../state';
import { Store } from '@ngrx/store';
import { FocusComponent } from './ui/focus/focus.component';
import { ReflectionPromptComponent } from './features/reflection-prompt/reflection-prompt.component';
import { NEW_WHEEL_NAME, WheelNameFormComponent } from './features/wheel-name-form/wheel-name-form.component';
import { mapActiveWheel } from '../../utils/mappers/active-wheel.mapper';
import { WheelStateCategory } from '../../state/typings';
import { defaultWheelIdByLocale } from './wheel.constants';
import { sortByColumns } from './util/sort-categories-by-columns';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'wil-wheel',
  templateUrl: './wheel.component.html',
  styleUrls: ['./wheel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CategoryComponent,
    ActionButtonsComponent,
    FlexLayoutModule,
    CanvasComponent,
    FocusComponent,
    WheelNameFormComponent,
    ReflectionPromptComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WheelComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  public readonly wheelId = input<string>('default');
  public readonly type = input.required<'noAuth' | 'free' | 'personal' | 'professional'>();
  public readonly session = input<WheelSessionOutputDto | null>(null);
  public readonly allowClick = input<boolean>(true);
  public readonly showFocus = input<boolean>(true);
  public readonly showCategories = input<boolean>(true);
  public readonly showActionButtons = input<boolean>(true);
  public readonly clientId = input<string | null | undefined>(null);
  public readonly coachId = input<string | null>(null);

  public readonly disableSaveWheelButton = signal(false);
  public readonly hasEditingOpen = signal(false);
  public readonly errorMessage = signal(true);
  public readonly name = signal<string>(NEW_WHEEL_NAME);

  public readonly wheelSectionFlex = computed(() => (this.showCategories() ? '48%' : '100%'));

  public readonly mode$ = this.store.select(selectMode);
  public readonly categories$ = this.store.select(selectCategories);
  public readonly hasAllScores$ = this.store.select(selectHasAllScores);
  public readonly hasUnsavedWheelChanges$ = this.store.select(selectHasUnsavedCategoriesChanges);
  public readonly categoriesColumns$: Observable<WheelStateCategory[][]> = this.categories$.pipe(
    tap(() => this.hasEditingOpen.set(false)),
    map((categories) => sortByColumns(categories))
  );

  public readonly DEFAULT_NEW_WHEEL_NAME = NEW_WHEEL_NAME;

  public readonly handleWheelSave$ = new Subject<void>();
  private readonly wheelInputChanged$ = new Subject<void>();

  constructor() {
    effect(
      () => {
        this.wheelId();
        this.session();

        this.wheelInputChanged$.next();
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.wheelInputChanged$
      .pipe(withLatestFrom(this.store.select(selectUserWheels), this.store.select(selectLang)), takeUntilDestroyed(this.destroyRef))
      .subscribe(([, wheels, locale]) => {
        if (this.type() === 'noAuth') {
          const id = defaultWheelIdByLocale(locale);

          this.store.dispatch(initializeWheel({ wheelId: id }));
          this.store.dispatch(loadDefaultTemplate({ wheelId: id }));

          return;
        }

        const activeWheel = mapActiveWheel(wheels, this.wheelId(), this.session());

        if (!activeWheel) return;

        this.store.dispatch(setActiveWheel({ wheel: activeWheel }));
        this.handleNameChange({ name: activeWheel.name!, hasError: false });
      });

    this.handleWheelSave$.pipe(withLatestFrom(this.categories$), takeUntilDestroyed(this.destroyRef)).subscribe(([, categories]) => {
      const name = this.name();
      if (!name) return;

      this.store.dispatch(
        updatePersonalWheel({ wheelId: this.wheelId(), updates: { name, categoryIds: categories.map((cat) => cat.id) } })
      );
    });

    this.store
      .select(selectLang)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.wheelInputChanged$.next();
      });
  }

  public handleNameChange({ name, hasError }: { name: string; hasError: boolean }): void {
    this.disableSaveWheelButton.set(hasError);
    this.name.set(name);
  }
}
