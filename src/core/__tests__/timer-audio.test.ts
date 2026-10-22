// ============================================================================
// Napar (Steepwise) — Unit Tests: Timer Audio & Chime
// ============================================================================

import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as announceModule from '../announce';
import {
  playTimerChime,
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

  test('dzwonek ma dominującą częstotliwość A4 = 440 Hz (dekodowanie próbek WAV i DFT)', () => {
    const buffer = Buffer.from(CHIME_AUDIO_DATA_URI.replace('data:audio/wav;base64,', ''), 'base64');
    const sampleRate = buffer.readUInt32LE(24);
    const channels = buffer.readUInt16LE(22);
    const bitsPerSample = buffer.readUInt16LE(34);
    expect(channels).toBe(1);
    expect(bitsPerSample).toBe(16);

    // Próbki PCM 16-bit po chunku 'data' (nagłówek 44 bajty)
    const dataOffset = buffer.indexOf('data') + 8;
    const sampleCount = Math.floor((buffer.length - dataOffset) / 2);
    const samples = new Float64Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = buffer.readInt16LE(dataOffset + i * 2) / 32768;
    }

    // Moc widma (DFT): grubo co 5 Hz w zakresie 100–2000 Hz, potem dokładnie co 1 Hz wokół maksimum
    const powerAt = (freq: number): number => {
      let re = 0;
      let im = 0;
      for (let i = 0; i < sampleCount; i++) {
        const angle = (2 * Math.PI * freq * i) / sampleRate;
        re += samples[i] * Math.cos(angle);
        im -= samples[i] * Math.sin(angle);
      }
      return re * re + im * im;
    };
    let coarseFreq = 100;
    let coarsePower = -1;
    for (let f = 100; f <= 2000; f += 5) {
      const p = powerAt(f);
      if (p > coarsePower) {
        coarsePower = p;
        coarseFreq = f;
      }
    }
    let bestFreq = coarseFreq;
    let bestPower = -1;
    for (let f = coarseFreq - 5; f <= coarseFreq + 5; f += 1) {
      const p = powerAt(f);
      if (p > bestPower) {
        bestPower = p;
        bestFreq = f;
      }
    }
    expect(bestFreq).toBe(440);
  });
});
