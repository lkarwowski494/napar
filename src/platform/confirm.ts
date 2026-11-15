// ============================================================================
// Napar — Standard Spójnych Potwierdzeń (wzorce Apps4Brew)
// Zgodność z Apple HIG Alerts: zawsze „Anuluj” jako przycisk rezygnacji
// ============================================================================

import { Alert } from 'react-native';
import { getCurrentTranslations } from '../core/i18n';

export type CancelBtn = { text: string; style: 'cancel'; onPress?: () => void };

/** Przycisk rezygnacji „Anuluj” / „Cancel” */
export const cancelButton = (onPress?: () => void): CancelBtn => ({
  text: getCurrentTranslations().common.cancel,
  style: 'cancel',
  ...(onPress ? { onPress } : {}),
});

/** Pytanie z dwoma przyciskami: „Anuluj” + akcja (destructive — czerwona) */
export function confirmAction({
  title,
  message,
  actionText,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  actionText: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  Alert.alert(title, message, [
    cancelButton(onCancel),
    {
      text: actionText,
      ...(destructive ? { style: 'destructive' as const } : {}),
      onPress: onConfirm,
    },
  ]);
}

