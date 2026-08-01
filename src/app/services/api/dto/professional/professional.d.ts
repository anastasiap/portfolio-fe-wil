interface ProfessionalBrandOutputDto {
  id: string;
  accountId: string;
  brandName: string;
  logoUrl?: string;
  logoFileName?: string;
  logoStorageKey?: string;
  primaryColor?: string;
  secondaryColor?: string;
  website?: string;
  description?: string;
  audit: {
    createdAt: string;
    updatedAt: string;
  };
}

interface CreateProfessionalBrandDto {
  brandName: string;
  logoUrl?: string;
  logoFileName?: string;
  logoStorageKey?: string;
  primaryColor?: string;
  secondaryColor?: string;
  website?: string;
  description?: string;
}

interface UpdateProfessionalBrandDto {
  brandName?: string;
  logoUrl?: string;
  logoFileName?: string;
  logoStorageKey?: string;
  primaryColor?: string;
  secondaryColor?: string;
  website?: string;
  description?: string;
}

type WheelLinkState = 'active' | 'revoked' | 'expired';

interface WheelLink {
  readonly id: string;
  readonly accountId: string; // owner account
  readonly participantId: string;
  readonly wheelId: string;
  readonly wheelVersionId?: string;
  readonly token: string; // 128-bit random, URL-safe
  readonly route: string; // e.g., '/wheel/:token'
  readonly expiresAt: Date;
  readonly maxUses: number; // >= 1
  readonly uses: number; // starts at 0
  readonly state: WheelLinkState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastAccessAt?: Date;
  readonly isDeleted: boolean;
}

interface CreateWheelLinkRequestDto {
  readonly wheelId: string;
  readonly wheelVersionId: string;
  readonly maxUses: number; // >= 1
  readonly expiresAt?: Date;
}

interface ResolvedWheelLink extends WheelLink {
  readonly linkUrl: string; // e.g. 'https://app.com/wheel/abcd...'
  readonly wheelName: string;
}
