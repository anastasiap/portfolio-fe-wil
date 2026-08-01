import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { NEW_WHEEL_NAME, WheelNameFormComponent } from './wheel-name-form.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { setWheelNewName } from '../../../../state';

describe('WheelNameFormComponent', () => {
  let component: WheelNameFormComponent;
  let fixture: ComponentFixture<WheelNameFormComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const setup = (wheelName?: string | null): void => {
    fixture = TestBed.createComponent(WheelNameFormComponent);

    if (wheelName !== undefined) {
      fixture.componentRef.setInput('wheelName', wheelName);
    }

    component = fixture.componentInstance;
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    fixture.detectChanges();
  };

  const getInput = (): HTMLInputElement => {
    return fixture.debugElement.query(By.css('[data-testid="wheel-name-input"]')).nativeElement as HTMLInputElement;
  };

  const setInputValue = (value: string): void => {
    const input = getInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WheelNameFormComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    }).compileComponents();

    store = TestBed.inject(MockStore);
  });

  it('should create', () => {
    setup();

    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should render the form field and input with expected attributes', () => {
      setup();

      const form = fixture.debugElement.query(By.css('[data-testid="wheel-name-form"]'));
      const field = fixture.debugElement.query(By.css('[data-testid="wheel-name-field"]'));
      const label = fixture.debugElement.query(By.css('[data-testid="wheel-name-label"]'));
      const input = getInput();

      expect(form).toBeTruthy();
      expect(field).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toBe('Wheel Name');
      expect(input.placeholder).toBe('Fitness Assessment, Wellbeing, Quarterly check...');
      expect(input.getAttribute('maxlength')).toBe('200');
      expect(input.value).toBe(NEW_WHEEL_NAME);
    });

    it('should render the provided wheel name as the input value', () => {
      setup('Selected wheel');

      const input = getInput();

      expect(input.value).toBe('Selected wheel');
    });
  });

  describe('validation messages', () => {
    it('should render the generic wheel name error for the default wheel name', () => {
      setup();

      const genericError = fixture.debugElement.query(By.css('[data-testid="wheel-name-generic-error"]'));

      expect(genericError.nativeElement.textContent.trim()).toBe('Update your Wheel name with something unique and special for you');
    });

    it('should render the required error when the input is empty', () => {
      setup('Selected wheel');

      setInputValue('');

      const requiredError = fixture.debugElement.query(By.css('[data-testid="wheel-name-required-error"]'));
      const genericError = fixture.debugElement.query(By.css('[data-testid="wheel-name-generic-error"]'));

      expect(requiredError.nativeElement.textContent.trim()).toBe('Wheel name is required');
      expect(genericError).toBeNull();
    });

    it('should render the maxlength error when the input is longer than 100 characters', () => {
      setup('Selected wheel');

      setInputValue('a'.repeat(101));

      const maxlengthError = fixture.debugElement.query(By.css('[data-testid="wheel-name-maxlength-error"]'));

      expect(maxlengthError.nativeElement.textContent.trim()).toBe('name must be 100 characters or less');
    });

    it('should not render validation errors when the input has a valid wheel name', () => {
      setup();

      setInputValue('Quarterly wellbeing check');

      const errors = fixture.debugElement.queryAll(By.css('mat-error'));

      expect(errors).toEqual([]);
    });
  });

  describe('name changes', () => {
    it('should dispatch and emit the typed wheel name with the current validation state', () => {
      setup('Selected wheel');
      const nameChangedSpy = spyOn(component.nameChanged, 'emit');

      setInputValue('Quarterly wellbeing check');

      expect(dispatchSpy).toHaveBeenCalledWith(setWheelNewName({ name: 'Quarterly wellbeing check' }));
      expect(nameChangedSpy).toHaveBeenCalledWith({ name: 'Quarterly wellbeing check', hasError: false });
    });
  });
});
