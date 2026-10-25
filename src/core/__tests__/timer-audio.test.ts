// ============================================================================
// Napar (Steepwise) — Unit Tests: Timer Audio & Chime
// ============================================================================

import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as announceModule from '../announce';
import {
  playTimerChime,
  stopTimerChime,
  notifyTimerStepWarning,
  notifyTimerFinished,
  CHIME_AUDIO_DATA_URI,
} from '../timer-audio';

const mockPlay = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: mockPlay,
    remove: mockRemove,
  })),
}));

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
    stopTimerChime();
    announceSpy.mockRestore();
  });

  test('playTimerChime tworzy odtwarzacz audio z właściwym URI i wywołuje play', async () => {
    const success = await playTimerChime();
    expect(success).toBe(true);
    expect(createAudioPlayer).toHaveBeenCalledWith(CHIME_AUDIO_DATA_URI);
    expect(mockPlay).toHaveBeenCalled();
  });

  test('playTimerChime obsługuje błąd odtwarzania i zwraca false', async () => {
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Audio device error');
    });
    const success = await playTimerChime();
    expect(success).toBe(false);
  });

  test('notifyTimerStepWarning anonsuje VoiceOver, wywołuje haptykę i odtwarza dźwięk', async () => {
    const success = await notifyTimerStepWarning(3);
    expect(success).toBe(true);
    expect(announceSpy).toHaveBeenCalledWith('Pozostały 3 sekundy do końca zalania');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    expect(createAudioPlayer).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  test('notifyTimerFinished anonsuje sukces, wywołuje haptykę success i odtwarza dźwięk', async () => {
    const success = await notifyTimerFinished('Preinfuzja');
    expect(success).toBe(true);
    expect(announceSpy).toHaveBeenCalledWith('Krok ukończony: Preinfuzja');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    expect(createAudioPlayer).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  test('notifyTimerFinished bez nazwy kroku anonsuje domyślny koniec', async () => {
    await notifyTimerFinished();
    expect(announceSpy).toHaveBeenCalledWith('Parzenie zakończone!');
  });

  test('CHIME_AUDIO_DATA_URI zawiera prawidłowy plik audio RIFF WAV z rzeczywistymi próbkami PCM', () => {
    expect(CHIME_AUDIO_DATA_URI.startsWith('data:audio/wav;base64,')).toBe(true);
    const base64Data = CHIME_AUDIO_DATA_URI.replace('data:audio/wav;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');
    expect(buffer.slice(0, 4).toString('ascii')).toBe('RIFF');
    expect(buffer.slice(8, 12).toString('ascii')).toBe('WAVE');
    expect(buffer.slice(12, 16).toString('ascii')).toBe('fmt ');
    // Dane PCM muszą zawierać rzeczywiste próbki audio (> 1000 bajtów)
    expect(buffer.length).toBeGreaterThan(1000);
  });

  test('stopTimerChime zatrzymuje instancję i usuwa zasób odtwarzacza (TASK-P6-08-PRO)', async () => {
    await playTimerChime();
    expect(mockPlay).toHaveBeenCalled();
    stopTimerChime();
    expect(mockRemove).toHaveBeenCalled();
  });
});
