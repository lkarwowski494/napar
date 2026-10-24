import React from 'react';
import renderer from 'react-test-renderer';
import { Alert, AccessibilityInfo } from 'react-native';
import { cancelButton, okButton, confirmAction } from '../confirm';
import {
  announce,
  useAnnounce,
  formatStepAnnouncement,
  formatCountdownAnnouncement,
  formatStartAnnouncement,
  formatFinishAnnouncement,
  announceStep,
  announceCountdown,
  announceFinish,
  announceStart,
} from '../announce';

describe('Confirm & Announce helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cancelButton tworzy przycisk ze stylem cancel i opcjonalnym onPress', () => {
    const btn = cancelButton();
    expect(btn.text).toBe('Anuluj');
    expect(btn.style).toBe('cancel');

    const onCancelMock = jest.fn();
    const btnWithCallback = cancelButton(onCancelMock);
    expect(btnWithCallback.onPress).toBe(onCancelMock);
    btnWithCallback.onPress!();
    expect(onCancelMock).toHaveBeenCalled();
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

  test('announce wywołuje AccessibilityInfo.announceForAccessibility i obsługuje błędy', () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    announce('Krok 1 zakończony');
    expect(announceSpy).toHaveBeenCalledWith('Krok 1 zakończony');

    // Obsługa błędu gdy announce rzuca wyjątek
    announceSpy.mockImplementation(() => {
      throw new Error('Accessibility error');
    });
    expect(() => announce('Test error')).not.toThrow();
  });

  test('useAnnounce wywołuje announce tylko wtedy, gdy przekazano tekst', () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    const TestComponent: React.FC<{ msg?: string | null }> = ({ msg }) => {
      useAnnounce(msg);
      return null;
    };

    renderer.act(() => {
      renderer.create(React.createElement(TestComponent, { msg: null }));
    });
    expect(announceSpy).not.toHaveBeenCalled();

    renderer.act(() => {
      renderer.create(React.createElement(TestComponent, { msg: 'Komunikat głosowy' }));
    });
    expect(announceSpy).toHaveBeenCalledWith('Komunikat głosowy');
  });

  test('formatStepAnnouncement generuje prawidłowe komunikaty w PL i EN', () => {
    // PL z instrukcją
    const plWithInstr = formatStepAnnouncement(1, 4, 'Preinfuzja', 50, 45, 'Zalewaj spiralnie.', 'pl');
    expect(plWithInstr).toBe('Krok 1 z 4: Preinfuzja. Cel wody: 50 g. Czas trwania: 45 sekund. Zalewaj spiralnie.');

    // PL bez instrukcji
    const plNoInstr = formatStepAnnouncement(2, 4, 'Zalanie 1', 120, 30, undefined, 'pl');
    expect(plNoInstr).toBe('Krok 2 z 4: Zalanie 1. Cel wody: 120 g. Czas trwania: 30 sekund.');

    // EN z instrukcją
    const enWithInstr = formatStepAnnouncement(1, 4, 'Bloom', 50, 45, 'Pour spiral.', 'en');
    expect(enWithInstr).toBe('Step 1 of 4: Bloom. Target water: 50 g. Step duration: 45 seconds. Pour spiral.');

    // EN bez instrukcji
    const enNoInstr = formatStepAnnouncement(2, 4, 'Pour 1', 120, 30, undefined, 'en');
    expect(enNoInstr).toBe('Step 2 of 4: Pour 1. Target water: 120 g. Step duration: 30 seconds.');
  });

  test('formatCountdownAnnouncement generuje poprawne komunikaty odliczania w PL i EN', () => {
    expect(formatCountdownAnnouncement(3, 'pl')).toBe('3 sekundy do końca etapu.');
    expect(formatCountdownAnnouncement(3, 'en')).toBe('3 seconds remaining in this step.');
  });

  test('formatStartAnnouncement generuje poprawne zapowiedzi startu w PL i EN', () => {
    expect(formatStartAnnouncement('V60 4:6', 20, 300, 'pl')).toBe(
      'Rozpoczęto parzenie V60 4:6. Doza: 20 g, woda: 300 g.'
    );
    expect(formatStartAnnouncement('V60 4:6', 20, 300, 'en')).toBe(
      'Started brewing V60 4:6. Dose: 20 g, water: 300 g.'
    );
  });

  test('formatFinishAnnouncement generuje poprawne zapowiedzi finiszu w PL i EN dla różnych czasów', () => {
    // > 60 sekund
    expect(formatFinishAnnouncement('AeroPress', 145, 'pl')).toBe(
      'Parzenie AeroPress zakończone. Całkowity czas: 2 min 25 s. Smacznego!'
    );
    expect(formatFinishAnnouncement('AeroPress', 145, 'en')).toBe(
      'Brewing of AeroPress finished. Total time: 2 min 25 s. Enjoy your cup!'
    );

    // <= 60 sekund
    expect(formatFinishAnnouncement('Espresso', 28, 'pl')).toBe(
      'Parzenie Espresso zakończone. Całkowity czas: 28 sekund. Smacznego!'
    );
    expect(formatFinishAnnouncement('Espresso', 28, 'en')).toBe(
      'Brewing of Espresso finished. Total time: 28 seconds. Enjoy your cup!'
    );

    // 1 sekunda (liczba pojedyncza)
    expect(formatFinishAnnouncement('Ristretto', 1, 'pl')).toBe(
      'Parzenie Ristretto zakończone. Całkowity czas: 1 sekunda. Smacznego!'
    );
    expect(formatFinishAnnouncement('Ristretto', 1, 'en')).toBe(
      'Brewing of Ristretto finished. Total time: 1 second. Enjoy your cup!'
    );

    // Domyślny język (PL)
    expect(formatFinishAnnouncement('Drip', 120)).toBe(
      'Parzenie Drip zakończone. Całkowity czas: 2 min 0 s. Smacznego!'
    );
    expect(formatStartAnnouncement('V60', 15, 250)).toBe(
      'Rozpoczęto parzenie V60. Doza: 15 g, woda: 250 g.'
    );
    expect(formatCountdownAnnouncement(3)).toBe('3 sekundy do końca etapu.');
  });

  test('announceStep, announceCountdown, announceFinish, announceStart wywołują AccessibilityInfo', () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    announceStep(1, 3, 'Preinfuzja', 60, 45, 'Zalej kawę', 'pl');
    expect(announceSpy).toHaveBeenCalledWith(
      'Krok 1 z 3: Preinfuzja. Cel wody: 60 g. Czas trwania: 45 sekund. Zalej kawę'
    );

    // Bez opcjonalnej instrukcji i z domyślnym językiem
    announceStep(2, 3, 'Zalanie', 150, 45);
    expect(announceSpy).toHaveBeenCalledWith(
      'Krok 2 z 3: Zalanie. Cel wody: 150 g. Czas trwania: 45 sekund.'
    );

    announceCountdown(3);
    expect(announceSpy).toHaveBeenCalledWith('3 sekundy do końca etapu.');

    announceFinish('V60', 180);
    expect(announceSpy).toHaveBeenCalledWith(
      'Parzenie V60 zakończone. Całkowity czas: 3 min 0 s. Smacznego!'
    );

    announceStart('Kalita Wave', 18, 300);
    expect(announceSpy).toHaveBeenCalledWith(
      'Rozpoczęto parzenie Kalita Wave. Doza: 18 g, woda: 300 g.'
    );

    // Wersje angielskie
    announceStep(1, 3, 'Bloom', 60, 45, 'Pour spiral', 'en');
    expect(announceSpy).toHaveBeenCalledWith(
      'Step 1 of 3: Bloom. Target water: 60 g. Step duration: 45 seconds. Pour spiral'
    );

    announceCountdown(3, 'en');
    expect(announceSpy).toHaveBeenCalledWith('3 seconds remaining in this step.');

    announceFinish('V60', 180, 'en');
    expect(announceSpy).toHaveBeenCalledWith(
      'Brewing of V60 finished. Total time: 3 min 0 s. Enjoy your cup!'
    );

    announceStart('V60', 15, 250, 'en');
    expect(announceSpy).toHaveBeenCalledWith(
      'Started brewing V60. Dose: 15 g, water: 250 g.'
    );
  });
});
