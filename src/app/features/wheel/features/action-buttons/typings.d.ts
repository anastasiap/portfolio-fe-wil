import { GaEventsSource } from '../../../../services/analytics/analytics.service';
import { WheelStateCategory } from '../../../../state/typings';

export interface FocusModalData {
  wheelId: string;
  source: GaEventsSource;
}

export type DownloadModalState = 'loading' | 'preview';

export interface DownloadImageModalData {
  categories: WheelStateCategory[] | null;
}
