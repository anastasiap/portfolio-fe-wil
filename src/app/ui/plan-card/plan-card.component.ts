import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CtaButtonComponent } from '../cta-button/cta-button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'wil-plan-card',
  standalone: true,
  imports: [CommonModule, CtaButtonComponent],
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCardComponent {
  private readonly router = inject(Router);

  public readonly planData = input.required<PlanCardData>();

  @Output()
  public readonly ctaClick = new EventEmitter<PlanCardData>();

  public onCtaClick(): void {
    this.ctaClick.emit(this.planData());
  }

  public navigate(e: Event): void {
    e.preventDefault();
    const planType = this.planData().planType === 'Free' ? 'free' : 'personal';
    this.router.navigate(['/how-personal-plan-works'], { state: { planType } });
  }
}
