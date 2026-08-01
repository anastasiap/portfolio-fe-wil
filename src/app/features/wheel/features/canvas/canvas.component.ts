import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WheelService } from '../../services/wheel.service';
import { selectActiveWheel, setScore } from '../../../../state';
import { Store } from '@ngrx/store';
import { isPlatformBrowser } from '@angular/common';
import { SingleWheelState } from '../../../../state/typings';
import { MARK_SYSTEM } from '../../wheel.constants';

@Component({
  selector: 'wil-canvas',
  standalone: true,
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WheelService],
})
export class CanvasComponent implements AfterViewInit {
  private readonly store = inject(Store);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly service: WheelService = inject(WheelService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly allowClick = input<boolean>(true);

  @ViewChild('wheelCanvas') public canvas: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('wrapper') private readonly wrapper: ElementRef<HTMLDivElement> | undefined;

  ngAfterViewInit(): void {
    if (this.canvas) {
      const canvas = this.canvas.nativeElement;

      this.store
        .select(selectActiveWheel)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((wheel) => {
          if (!wheel) return;
          this.drawWheel(canvas, wheel);
        });
    }
  }

  public setData(e: MouseEvent): void {
    if (!this.allowClick()) return;

    const { score, categoryId } = this.service.handleSelection(e);

    this.store.dispatch(setScore({ categoryId, score }));
  }

  private setResponsiveAttributesForCanvas(): void {
    if (!isPlatformBrowser(this.platformId) || !this.wrapper || !this.canvas) {
      return;
    }

    const wrapperElement = this.wrapper.nativeElement;
    const canvasElement = this.canvas.nativeElement;

    if (wrapperElement && canvasElement) {
      const wrapperWidth = wrapperElement.offsetWidth;

      // Get device pixel ratio (defaults to 1 if not supported)
      const devicePixelRatio = window.devicePixelRatio || 1;

      // DON'T set CSS size - let existing CSS handle responsive layout
      // The canvas already has width: 100% in CSS
      // ONLY set internal resolution scaled by device pixel ratio
      canvasElement.width = wrapperWidth * devicePixelRatio;
      canvasElement.height = wrapperWidth * devicePixelRatio;

      // Scale the drawing context to match
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }

      // Keep the wrapper styling as before
      wrapperElement.setAttribute('style', `height: ${wrapperWidth}px; width: ${wrapperWidth}px;`);
    }
  }

  private drawWheel(canvas: HTMLCanvasElement, wheel: SingleWheelState): void {
    this.setResponsiveAttributesForCanvas();
    this.service.createWheel(canvas, wheel.categories, MARK_SYSTEM);
  }
}
