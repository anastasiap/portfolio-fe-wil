import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { LandingCoachesComponent } from './landing-coaches.component';
import { By } from '@angular/platform-browser';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('LandingCoachesComponent', () => {
  let component: LandingCoachesComponent;
  let fixture: ComponentFixture<LandingCoachesComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const initialState = {
    wheel: {
      categories: [],
      descriptionKey: 0,
      homeWheelKey: 0,
      lang: 'en',
      wheelKey: 0,
    },
  };

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as MatDialogRef<unknown>);

    await TestBed.configureTestingModule({
      imports: [LandingCoachesComponent, MatDialogModule, NoopAnimationsModule, RouterTestingModule],
      providers: [provideMockStore({ initialState }), { provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingCoachesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the /coaches page at the root route', () => {
    const article = fixture.debugElement.query(By.css('article'));
    expect(article).toBeTruthy();
  });

  it('renders content as a semantic article', () => {
    const article = fixture.debugElement.query(By.css('article'));
    expect(article).toBeTruthy();
  });

  it('shows the correct H1 title', () => {
    const h1 = fixture.debugElement.query(By.css('h1'));

    expect(h1.nativeElement.textContent).toMatch(/Embed the Wheel of Life on Your Website/i);
  });

  it('shows the correct introductory paragraph', () => {
    const p = fixture.debugElement.query(By.css('article p'));

    expect(p.nativeElement.textContent).toMatch(/The Wheel fits beautifully into my program/i);
  });

  it('shows a pricing table with the current offer', () => {
    const table = fixture.debugElement.query(By.css('[data-testid="landing-coaches-pricing-table"]'));
    const columns = table.queryAll(By.css('.pricing-column'));

    expect(columns.length).toBe(1);
  });

  it('shows the current offer title and price', () => {
    const full = fixture.debugElement.query(By.css('[data-testid="landing-coaches-pricing-table-column-full"]'));

    expect(full).toBeTruthy();
    expect(full.nativeElement.textContent).toMatch(/Done-for-You Wheel Setup/i);
    expect(full.nativeElement.textContent).toMatch(/\$399/);
  });

  it('shows current offer details', () => {
    const full = fixture.debugElement.query(By.css('[data-testid="landing-coaches-pricing-table-column-full"]'));

    expect(full).toBeTruthy();
    expect(full.nativeElement.textContent).toMatch(/Your own categories and descriptions/i);
    expect(full.nativeElement.textContent).toMatch(/Client results sent directly to you/i);
    expect(full.nativeElement.textContent).toMatch(/Wheel setup and integration on your website/i);
  });

  it('contains setup information', () => {
    const full = fixture.debugElement.query(By.css('[data-testid="landing-coaches-pricing-table-column-full"]'));

    expect(full).toBeTruthy();
    expect(full.nativeElement.textContent).toMatch(/Wheel setup and integration on your website/i);
  });

  it('shows the website compatibility note', () => {
    const full = fixture.debugElement.query(By.css('[data-testid="landing-coaches-pricing-table-column-full"]'));

    expect(full).toBeTruthy();
    expect(full.nativeElement.textContent).toMatch(/Website compatibility check required before purchase/i);
  });

  it('shows a clearly visible CTA button labeled "I\'m interested"', () => {
    const button = fixture.debugElement.query(By.css('button'));

    expect(button.nativeElement.textContent).toMatch(/I'm interested/i);
    expect(button.nativeElement.offsetParent).not.toBeNull();
  });

  it('opens a modal window when CTA is clicked', () => {
    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();
    fixture.detectChanges();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '500px',
      autoFocus: true,
      role: 'dialog',
      data: {},
      panelClass: 'modal-panel',
    });
  });
});
