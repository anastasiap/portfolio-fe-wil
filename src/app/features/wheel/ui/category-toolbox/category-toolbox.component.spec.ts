import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { CategoryToolboxComponent } from './category-toolbox.component';
import { APP_ICON_NAMES } from '../../../../core/services/app-icon-registry';

describe('CategoryToolboxComponent', () => {
  let component: CategoryToolboxComponent;
  let fixture: ComponentFixture<CategoryToolboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryToolboxComponent],
    }).compileComponents();

    const iconRegistry = TestBed.inject(MatIconRegistry);
    const sanitizer = TestBed.inject(DomSanitizer);
    [APP_ICON_NAMES.check, APP_ICON_NAMES.color, APP_ICON_NAMES.delete, APP_ICON_NAMES.edit].forEach((iconName) => {
      iconRegistry.addSvgIconLiteral(iconName, sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
    });

    fixture = TestBed.createComponent(CategoryToolboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render toolbox actions as buttons with accessible labels', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[type="button"]'));

    expect(buttons.length).toBe(3);
    expect(buttons[0].nativeElement.getAttribute('aria-label')).toBe('Delete category');
    expect(buttons[1].nativeElement.getAttribute('aria-label')).toBe('Change category color');
    expect(buttons[2].nativeElement.getAttribute('aria-label')).toBe('Edit category');
  });

  it('should stop propagation and emit save outputs from check action', () => {
    spyOn(component.updateData, 'emit');
    spyOn(component.toggleEditMode, 'emit');
    component.isEditMode = true;
    fixture.detectChanges();

    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.saveChanges(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.updateData.emit).toHaveBeenCalled();
    expect(component.toggleEditMode.emit).toHaveBeenCalled();
  });
});
