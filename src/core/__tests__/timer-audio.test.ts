// ============================================================================
// Napar (Steepwise) — Unit Tests: Timer Audio & Chime
// ============================================================================

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as announceModule from '../announce';
import {
  playTimerChime,
  notifyTimerStepWarning,
  notifyTimerFinished,
  CHIME_AUDIO_DATA_URI,
} from '../timer-audio';

jest.mock('expo-av', () => {
  const mockSound = {
    unloadAsync: jest.fn().mockResolvedValue(undefined),
  };
  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
      },
    },
  };
});

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
  },
}));

describe('Timer Audio & Chime Engine', () => {
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    announceSpy = jest.spyOn(announceModule, 'announce').mockImplementation(() => {});
  });

  afterEach(() => {
    announceSpy.mockRestore();
  });

  test('playTimerChime tworzy instancję dźwięku z właściwym URI', async () => {
    const success = await playTimerChime();
    expect(success).toBe(true);
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: CHIME_AUDIO_DATA_URI },
      { shouldPlay: true, volume: 1.0 }
    );
  });

  test('playTimerChime obsługuje błąd odtwarzania i zwraca false', async () => {
    (Audio.Sound.createAsync as jest.Mock).mockRejectedValueOnce(new Error('Audio device error'));
    const success = await playTimerChime();
    expect(success).toBe(false);
  });

  test('notifyTimerStepWarning anonsuje VoiceOver, wywołuje haptykę i odtwarza dźwięk', async () => {
    const success = await notifyTimerStepWarning(3);
    expect(success).toBe(true);
    expect(announceSpy).toHaveBeenCalledWith('Pozostały 3 sekundy do końca zalania');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  test('notifyTimerFinished anonsuje sukces, wywołuje haptykę success i odtwarza dźwięk', async () => {
    const success = await notifyTimerFinished('Preinfuzja');
    expect(success).toBe(true);
    expect(announceSpy).toHaveBeenCalledWith('Krok ukończony: Preinfuzja');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  test('notifyTimerFinished bez nazwy kroku anonsuje domyślny koniec', async () => {
    await notifyTimerFinished();
    expect(announceSpy).toHaveBeenCalledWith('Parzenie zakończone!');
  });
});
