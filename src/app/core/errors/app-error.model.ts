export interface AppError {
  status: number;
  code: string;
  message: string; // user-facing safe message
  devMessage?: string; // backend message
  traceId?: string;
  url?: string;
  method?: string;
  timestamp: number;
}
