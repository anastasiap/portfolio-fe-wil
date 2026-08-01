import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { selectActiveWheel, setScore } from '../../../../state';
import { SingleWheelState, WheelStateCategory } from '../../../../state/typings';
import { WheelService } from '../../services/wheel.service';
import { CanvasComponent } from './canvas.component';

class FakeResizeObserver {
  public static readonly instances: FakeResizeObserver[] = [];

  public readonly observe = jasmine.createSpy('observe');
  public readonly disconnect = jasmine.createSpy('disconnect');

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  public trigger(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}

describe('CanvasComponent', () => {
  let store: MockStore;
  let activeWheelSelector: MemoizedSelector<object, SingleWheelState | null>;
  let canvasSize: number;
  let originalDevicePixelRatio: number;
  let originalResizeObserver: typeof ResizeObserver | undefined;

  const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'health',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 0,
    ...overrides,
  });

  const categories: WheelStateCategory[] = [
    createCategory(),
    createCategory({
      id: 'career',
      name: 'Career',
      description: 'Professional growth',
      color: '#00ff00',
      order: 1,
    }),
  ];

  const createActiveWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
    id: 'wheel-version-1',
    categories,
    name: 'Life Balance',
    descriptionKey: 0,
    wheelKey: 0,
    focus: [],
    focusLoading: false,
    loading: false,
    ...overrides,
  });

  const setup = ({
    activeWheel = createActiveWheel(),
    allowClick = true,
    devicePixelRatio = 1,
    width = 400,
  }: {
    activeWheel?: SingleWheelState | null;
    allowClick?: boolean;
    devicePixelRatio?: number;
    width?: number;
  } = {}): { fixture: ComponentFixture<CanvasComponent>; dispatchSpy: jasmine.Spy; wheel: WheelService } => {
    canvasSize = width;
    setDevicePixelRatio(devicePixelRatio);
    activeWheelSelector.setResult(activeWheel);
    store.refreshState();

    const fixture = TestBed.createComponent(CanvasComponent);
    fixture.componentRef.setInput('allowClick', allowClick);

    const wheel = fixture.debugElement.injector.get(WheelService);
    const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

    fixture.detectChanges();

    return { fixture, dispatchSpy, wheel };
  };

  const getCanvas = (fixture: ComponentFixture<CanvasComponent>): HTMLCanvasElement => {
    return fixture.debugElement.query(By.css('[data-testid="wheel-canvas"]')).nativeElement as HTMLCanvasElement;
  };

  const clickCanvas = (fixture: ComponentFixture<CanvasComponent>, clientX: number, clientY: number): void => {
    getCanvas(fixture).dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY }));
    fixture.detectChanges();
  };

  const setDevicePixelRatio = (value: number): void => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value,
    });
  };

  beforeEach(async () => {
    originalDevicePixelRatio = window.devicePixelRatio;
    originalResizeObserver = window.ResizeObserver;
    canvasSize = 400;
    FakeResizeObserver.instances.length = 0;

    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: FakeResizeObserver,
      writable: true,
    });

    spyOnProperty(HTMLElement.prototype, 'offsetWidth', 'get').and.callFake(() => canvasSize);
    spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').and.callFake(
      () =>
        ({
          bottom: canvasSize,
          height: canvasSize,
          left: 0,
          right: canvasSize,
          top: 0,
          width: canvasSize,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect)
    );

    await TestBed.configureTestingModule({
      imports: [CanvasComponent],
      providers: [provideMockStore()],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    activeWheelSelector = store.overrideSelector(selectActiveWheel, createActiveWheel());
  });

  afterEach(() => {
    setDevicePixelRatio(originalDevicePixelRatio);

    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: originalResizeObserver,
      writable: true,
    });
  });

  describe('click handling', () => {
    it('should not dispatch score changes when allowClick is false', () => {
      const { dispatchSpy, fixture } = setup({ allowClick: false });

      clickCanvas(fixture, 275, 200);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should dispatch the selected category and score for a valid wheel click', () => {
      const { dispatchSpy, fixture } = setup();

      clickCanvas(fixture, 275, 200);

      expect(dispatchSpy).toHaveBeenCalledOnceWith(setScore({ categoryId: 'health', score: 5 }));
    });

    it('should keep hit detection aligned when devicePixelRatio is greater than 1', () => {
      const { dispatchSpy, fixture } = setup({ devicePixelRatio: 2 });

      clickCanvas(fixture, 275, 200);

      expect(dispatchSpy).toHaveBeenCalledOnceWith(setScore({ categoryId: 'health', score: 5 }));
    });
  });
});
