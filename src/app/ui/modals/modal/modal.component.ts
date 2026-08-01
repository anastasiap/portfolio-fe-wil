import { Component, EventEmitter, input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'wil-modal',
  standalone: true,
  imports: [MatIcon, MatIconButton],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  public title = input.required<string>();
  public isLoading = input<boolean>(false);

  @Output() public closeModal = new EventEmitter<void>();
}
