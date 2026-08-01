import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'wil-custom-snackbar',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent {
  public readonly data: { iconName: string; message: string; icon: string } = inject(MAT_SNACK_BAR_DATA);
}
