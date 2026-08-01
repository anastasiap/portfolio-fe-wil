interface SaveResultsConfirmationData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showDontWarnCheckbox?: boolean;
}

interface SaveResultsConfirmationResult {
  confirmed: boolean;
  dontWarnAgain: boolean;
}
