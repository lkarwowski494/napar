// ============================================================================
// Napar (Steepwise) — Standard Spójnych Potwierdzeń (wzorce Apps4Brew)
// Zgodność z Apple HIG Alerts: zawsze „Anuluj” jako przycisk rezygnacji
// ============================================================================

import { Alert } from 'react-native';
import { getCurrentTranslations } from './i18n';

export type CancelBtn = { text: string; style: 'cancel'; onPress?: () => void };

/** Przycisk rezygnacji „Anuluj” / „Cancel” */
export const cancelButton = (onPress?: () => void): CancelBtn => ({
  text: getCurrentTranslations().common.cancel,
  style: 'cancel',
  ...(onPress ? { onPress } : {}),
});

/** Przycisk „OK” dla okien informacyjnych */
export const okButton = (): CancelBtn => ({
  text: getCurrentTranslations().common.ok,
  style: 'cancel',
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

/** Standardowy helper S5 confirm({ title, message, confirmText, destructive, onConfirm, onCancel }) */
export function confirm({
  title,
  message,
  confirmText,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmText: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  confirmAction({
    title,
    message,
    actionText: confirmText,
    destructive,
    onConfirm: onConfirm || (() => {}),
    onCancel,
  });
}

