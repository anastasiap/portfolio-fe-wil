import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoundComponent } from './not-found.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../../services/seo/seo.service';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    const mockSeoService = jasmine.createSpyObj('SeoService', ['updateSeoTags']);

    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule],
      providers: [{ provide: SeoService, useValue: mockSeoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
