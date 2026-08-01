import { AuthState } from './auth/auth.reducer';
import { GdprState } from './gdpr/gdpr.types';
import { Action } from '@ngrx/store';

interface WheelStateCategory {
  color: string;
  description: string;
  order: number;
  id: string;
  score: number;
  name: string;
}

interface SingleWheelState {
  id: string;
  categories: WheelStateCategory[];
  name: string | undefined;
  descriptionKey: number;
  wheelKey: number;
  focus: string[]; // Array of category IDs that are focused
  focusLoading: boolean;
  loading: boolean;
  sessionDraft?: {
    noteMd?: string;
    noteUpdatedAt?: string | null;
  };
}

type WheelStateMode = 'edit' | 'view';

interface WheelState {
  activeWheel: SingleWheelState | null;
  mode: WheelStateMode;
  homeWheelKey: number;
  lang: Locale;
  linkData: ParticipantsWheelViewDto | null;
  lastAction?: Action;
}

interface PersonalState {
  wheels: WheelVersion[];
  clients: ParticipantOutputWithLinksDto[];
  sessions: WheelSessionOutputDto[];
  brand: ProfessionalBrandOutputDto | null;
  loading: boolean;
  error: string | null;
}

interface AppState {
  wheel: WheelState;
  personal: PersonalState;
  auth: AuthState;
  gdpr: GdprState;
}

interface TrendPoint {
  date: string; // ISO
  value: number;
}

interface TrendSeries {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  points: TrendPoint[]; // smoothed only
}

type TrendLabel = 'increase' | 'decline' | 'stable' | 'volatile' | 'insufficient_data';

interface TrendBullet {
  categoryId: string;
  categoryName: string;
  label: TrendLabel;
  delta: number;
  volatility: number;
}

interface OverallTrend {
  canAnalyse: boolean;
  sessionsCount: number;
  series: TrendSeries[];
  visibleSeries: string[];
  bullets: TrendBullet[];
  hasFocus: boolean;
}
