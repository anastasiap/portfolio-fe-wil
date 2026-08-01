import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { WheelSwitcherComponent } from './wheel-switcher.component';
import { selectActiveWheel, selectHasAllScores, selectUserWheels, switchPersonalWheel } from '../../../../state';
import { SingleWheelState, WheelStateCategory } from '../../../../state/typings';

describe('WheelSwitcherComponent', () => {
  let fixture: ComponentFixture<WheelSwitcherComponent>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let dispatchSpy: jasmine.Spy;
  let activeWheel$: BehaviorSubject<SingleWheelState | null>;
  let userWheels$: BehaviorSubject<WheelVersion[]>;
  let hasAllScores$: BehaviorSubject<boolean>;

  const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'health',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 5,
    ...overrides,
  });

  const createActiveWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
    id: 'wheel-1',
    categories: [createCategory()],
    name: 'Life Balance',
    descriptionKey: 0,
    wheelKey: 0,
    focus: ['health'],
    focusLoading: false,
    loading: false,
    ...overrides,
  });

  const createWheelVersion = (overrides: Partial<WheelVersion> = {}): WheelVersion => ({
    id: 'wheel-1',
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    accountId: 'account-1',
    version: 1,
    name: 'Life Balance',
    categorySnapshots: [
      {
        categoryId: 'health',
        label: 'Health',
        description: 'Physical wellbeing',
        color: '#ff0000',
        isArchived: false,
      },
    ],
    focusIds: ['health'],
    isDefault: true,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  const createComponent = (): void => {
    fixture = TestBed.createComponent(WheelSwitcherComponent);
    fixture.detectChanges();
  };

  const selectWheel = (wheelId: string): void => {
    const component = fixture.componentInstance;

    component.onWheelSelectionChange({ value: wheelId } as MatSelectChange);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dispatchSpy = jasmine.createSpy('dispatch');
    activeWheel$ = new BehaviorSubject<SingleWheelState | null>(createActiveWheel());
    userWheels$ = new BehaviorSubject<WheelVersion[]>([
      createWheelVersion(),
      createWheelVersion({ id: 'wheel-2', name: 'Career Wheel', wheelVersionId: 'version-2' }),
    ]);
    hasAllScores$ = new BehaviorSubject<boolean>(false);

    const storeStub = {
      dispatch: dispatchSpy,
      select: (selector: unknown): Observable<unknown> => {
        if (selector === selectActiveWheel) {
          return activeWheel$.asObservable();
        }

        if (selector === selectUserWheels) {
          return userWheels$.asObservable();
        }

        if (selector === selectHasAllScores) {
          return hasAllScores$.asObservable();
        }

        return of(undefined);
      },
    };

    await TestBed.configureTestingModule({
      imports: [WheelSwitcherComponent, NoopAnimationsModule],
      providers: [
        { provide: Store, useValue: storeStub },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
  });

  it('should render a single wheel title when only one wheel is available', () => {
    // Arrange
    userWheels$.next([createWheelVersion()]);

    // Act
    createComponent();
    const title = fixture.debugElement.query(By.css('[data-testid="wheel-switcher-title"]'));
    const select = fixture.debugElement.query(By.css('[data-testid="wheel-switcher-select"]'));

    // Assert
    expect(title.nativeElement.textContent.trim()).toBe('Life Balance');
    expect(select).toBeNull();
  });

  it('should truncate long wheel titles to 60 characters', () => {
    // Arrange
    const longTitle = 'A'.repeat(61);
    activeWheel$.next(createActiveWheel({ name: longTitle }));
    userWheels$.next([createWheelVersion({ name: longTitle })]);

    // Act
    createComponent();
    const title = fixture.debugElement.query(By.css('[data-testid="wheel-switcher-title"]'));

    // Assert
    expect(title.nativeElement.textContent.trim()).toBe(`${'A'.repeat(60)}...`);
  });

  it('should not dispatch a switch action when selecting the current wheel', () => {
    // Arrange
    createComponent();

    // Act
    selectWheel('wheel-1');

    // Assert
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should dispatch a switch action when there are no unsaved changes', () => {
    // Arrange
    createComponent();
    const nextWheel = createWheelVersion({ id: 'wheel-2', name: 'Career Wheel', wheelVersionId: 'version-2' });

    // Act
    selectWheel('wheel-2');

    // Assert
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy.calls.mostRecent().args[0]).toEqual(switchPersonalWheel({ wheel: nextWheel, shouldSaveSession: undefined }));
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
