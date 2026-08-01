import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { navigationItems } from './user-account.config';

@Component({
  selector: 'wil-user-profile',
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountComponent {
  public readonly navigationItems = navigationItems;
}
