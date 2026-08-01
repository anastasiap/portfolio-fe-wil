type ParticipantStatus = 'active' | 'disabled';

interface ParticipantOutputWithLinksDto {
  readonly id: string;
  readonly accountId: string;
  readonly name: string;
  readonly notes?: string;
  readonly lastContact?: string;
  readonly assignedWheels: string[];
  readonly assignedWheelsResolved: ResolvedWheelLink[];
  readonly status: ParticipantStatus;
  readonly sessions: WheelSessionOutputDto[];
  readonly audit: {
    createdAt: string;
    updatedAt: string;
  };
}

interface CreateParticipantDto {
  readonly name: string;
  readonly notes?: string;
}

interface UpdateParticipantDto {
  readonly name?: string;
  readonly notes?: string;
  readonly assignedWheels?: string[];
  readonly status?: ParticipantStatus;
}

/**
 * Status of resolved client link
 */
type ResolvedParticipantsLinkStatus = 'ok' | 'unavailable';

/**
 * Participant information for client view
 */
interface ParticipantsWheelViewParticipantDto {
  id: string;
  name: string;
}

/**
 * Professional brand information for client view
 */
interface ParticipantsWheelViewBrandDto {
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  website?: string;
  description?: string;
}

/**
 * Wheel information for client view
 */
interface ParticipantsWheelViewWheelDto {
  id: string;
  name: string;
  versionId: string;
  version: number;
  categories: CategorySnapshot[];
}

/**
 * Current focus information for participant view
 */
interface ParticipantsWheelViewCurrentFocusDto {
  wheelId: string;
  categoryIds: string[];
}

interface ParticipantsWheelViewUserDto {
  id: string;
  accountId: string;
  name: string;
}

/**
 * Complete client wheel view DTO
 * Returned by LinkResolverService.resolveClientView()
 */
interface ParticipantsWheelViewDto {
  status: ResolvedParticipantsLinkStatus;
  // Only present when status === 'ok'
  participant?: ParticipantsWheelViewParticipantDto;
  wheel?: ParticipantsWheelViewWheelDto;
  user?: ParticipantsWheelViewUserDto;
  brand?: ParticipantsWheelViewBrandDto;
  currentFocus?: ParticipantsWheelViewCurrentFocusDto;
  token: string;
}
