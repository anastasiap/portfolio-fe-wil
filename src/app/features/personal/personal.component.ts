import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wil-personal',
  standalone: true,
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalComponent {}
