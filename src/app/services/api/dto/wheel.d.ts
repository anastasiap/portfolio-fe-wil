interface UpdateWheelDto {
  name?: string;
  categoryIds?: string[];
  isDefault?: boolean;
}

interface WheelFocusOutputDto {
  readonly id: string;
  readonly accountId: string;
  readonly userId: string;
  readonly wheelId: string;
  readonly categoryIds: string[];
  readonly createdAt: string; // ISO 8601 string
}

interface CategorySnapshot {
  readonly categoryId: string;
  readonly label: string;
  readonly description: string;
  readonly color: string;
  readonly order: number;
}

interface WheelTemplateDetailDto {
  id: string;
  name: string;
  latestVersionId: string;
  version: number;
  categories: CategorySnapshotDto[];
  description?: string;
}

interface CategorySnapshotDto {
  categoryId: string;
  label: string;
  description?: string;
  color: string;
  isArchived: boolean;
}

interface WheelVersionOutputDto {
  id: string;
  wheelId: string;
  accountId: string;
  version: number;
  name: string;
  categorySnapshots: CategorySnapshotDto[];
  focusIds: string[];
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WheelVersion extends WheelVersionOutputDto {
  wheelVersionId: string;
}

interface WheelOutputDto {
  id: string;
  name: string;
  accountId: string;
  categoryIds: string[];
  isDefault: boolean;
  createdAt: string;
  lastModified: string;
}

interface WheelTemplateSummaryDto {
  id: string;
  name: string;
  categoryCount: number;
  description?: string;
}

interface CreateSessionDto {
  wheelId: string;
  wheelVersionId: string;
  scores: SessionScoreDto[];
  focusAtSubmit: string[];
  locale: string;
  notes?: string;
}

interface SessionScoreDto {
  categoryId: string;
  value: number;
}

interface WheelSessionOutputDto {
  id: string;
  userId: string;
  accountId: string;
  wheelId: string;
  wheelVersionId: string;
  scores: SessionScoreDto[];
  focusAtSubmit: string[];
  locale: string;
  notes: string | null;
  submittedAt: string;
  isDeleted: boolean;
}
