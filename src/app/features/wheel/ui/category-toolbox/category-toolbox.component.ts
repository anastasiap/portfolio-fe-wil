import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorChromeModule } from 'ngx-color/chrome';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'wil-category-toolbox',
  standalone: true,
  imports: [CommonModule, MatIcon, ColorChromeModule],
  templateUrl: './category-toolbox.component.html',
  styleUrl: './category-toolbox.component.scss',
})
export class CategoryToolboxComponent {
  @Input() public isEditMode = false;
  @Input() public isColorEditMode = false;

  @Output() public readonly alert = new EventEmitter<void>();
  @Output() public readonly toggleColorPicker = new EventEmitter<void>();
  @Output() public readonly toggleEditMode = new EventEmitter<void>();
  @Output() public readonly updateData = new EventEmitter<void>();

  public saveChanges(event: MouseEvent): void {
    event.stopPropagation();
    this.updateData.emit();
    this.toggleEditMode.emit();
  }
}
