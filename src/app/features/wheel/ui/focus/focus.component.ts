import { Component, inject, Input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectFocusedCategories } from '../../../../state';
import { WheelStateCategory } from '../../../../state/typings';

@Component({
  selector: 'wil-focus',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './focus.component.html',
  styleUrl: './focus.component.scss',
})
export class FocusComponent {
  private store = inject(Store);

  @Input() public wheelId = 'default';

  public focusedCategories$: Observable<WheelStateCategory[]> = this.store.select(selectFocusedCategories);

  public trackByCategory(index: number, category: WheelStateCategory): string {
    return category.id;
  }
}
