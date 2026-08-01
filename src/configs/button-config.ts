import { WheelStateMode } from '../app/state/typings';

interface ButtonConfig {
  showAddCategory?: boolean;
  showResetMarks?: boolean;
  showDropChanges?: boolean;
  showDownload?: boolean;
  showSaveCategories?: boolean;
  showSaveResults?: boolean;
  showFocus?: boolean;
  showSend?: boolean;
  showEditWheel?: boolean;
  showAddWheel?: boolean;
  showAddDefaultWheel?: boolean;
  showDeleteWheel?: boolean;
  showSaveWheel?: boolean;
  showCancelEditsWheel?: boolean;
}

const BUTTON_CONFIGS: Record<`${ViewType}:${WheelStateMode}`, ButtonConfig> = {
  'noAuth:view': {
    showAddCategory: true,
    showResetMarks: true,
    showDropChanges: true,
    showDownload: true,
    showSaveCategories: true,
    showSaveResults: true,
  },
  'noAuth:edit': {},
  'free:view': {
    showResetMarks: true,
    showDropChanges: true,
    showDownload: true,
    showSaveCategories: false,
    showSaveResults: true,
    showFocus: true,
    showEditWheel: true,
    showAddWheel: true,
    showAddDefaultWheel: true,
    showDeleteWheel: true,
  },
  'personal:view': {
    showResetMarks: true,
    showDropChanges: true,
    showDownload: true,
    showSaveCategories: false,
    showSaveResults: true,
    showFocus: true,
    showEditWheel: true,
    showAddWheel: true,
    showAddDefaultWheel: true,
    showDeleteWheel: true,
  },
  'free:edit': { showAddCategory: true, showSaveWheel: true, showCancelEditsWheel: true },
  'personal:edit': { showAddCategory: true, showSaveWheel: true, showCancelEditsWheel: true },
  'professional:view': {},
  'professional:edit': {},
};

export function resolveButtonConfig(type: ViewType, mode: WheelStateMode): ButtonConfig {
  return BUTTON_CONFIGS[`${type}:${mode}`];
}
