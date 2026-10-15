// ============================================================================
// Napar (Steepwise) — Unit Tests: Confirm & Announce helpers
// ============================================================================

import { Alert, AccessibilityInfo } from 'react-native';
import { cancelButton, okButton, confirmAction } from '../confirm';
import { announce } from '../announce';

describe('Confirm & Announce helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cancelButton tworzy przycisk ze stylem cancel i etykietą Anuluj', () => {
    const btn = cancelButton();
    expect(btn.text).toBe('Anuluj');
    expect(btn.style).toBe('cancel');
  });

  test('okButton tworzy przycisk ze stylem cancel i etykietą OK', () => {
    const btn = okButton();
    expect(btn.text).toBe('OK');
    expect(btn.style).toBe('cancel');
  });

  test('confirmAction wywołuje Alert.alert z przyciskiem Anuluj i przyciskiem akcji', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onConfirm = jest.fn();

    confirmAction({
      title: 'Usuń paczkę',
      message: 'Czy na pewno chcesz usunąć?',
      actionText: 'Usuń',
      destructive: true,
      onConfirm,
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Usuń paczkę',
      'Czy na pewno chcesz usunąć?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Anuluj', style: 'cancel' }),
        expect.objectContaining({ text: 'Usuń', style: 'destructive' }),
      ])
    );
  });

  test('announce wywołuje AccessibilityInfo.announceForAccessibility', () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    announce('Krok 1 zakończony');
    expect(announceSpy).toHaveBeenCalledWith('Krok 1 zakończony');
  });
});
