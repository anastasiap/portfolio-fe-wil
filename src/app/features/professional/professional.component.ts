import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wil-professional',
  standalone: true,
  templateUrl: './professional.component.html',
  styleUrls: ['./professional.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalComponent {}
