interface SupportRequestMetadata {
  accountId: string | null;
  environment: string;
  browser: string;
  os: string;
  currentUrl: string;
  timestamp: string;
  timezone: string;
  activeWheelId: string | null;
}

interface SupportRequest {
  name: string;
  description: string;
  attachment?: File;
  metadata: SupportRequestMetadata;
}

interface SupportRequestResponse {
  success: boolean;
  message?: string;
  ticketId?: string;
}

interface FeatureRequestDto {
  email: string;
  plan?: string;
  event: string;
  sentAt?: string;
  nickname?: string;
}

interface InquiryDto {
  email: string;
  message?: string;
  sentAt?: string;
  nickname?: string;
}
