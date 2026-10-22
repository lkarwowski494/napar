// ============================================================================
// Napar (Steepwise) — Adapter zapisu karty degustacyjnej do PNG (poz. 31 MVP)
// ============================================================================

const mockCaptureRef = jest.fn();
const mockReleaseCapture = jest.fn();
jest.mock('react-native-view-shot', () => ({
  captureRef: (...args: unknown[]) => mockCaptureRef(...args),
  releaseCapture: (...args: unknown[]) => mockReleaseCapture(...args),
}));

const mockIsAvailableAsync = jest.fn();
const mockShareAsync = jest.fn();
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockIsAvailableAsync(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

import { shareTastingCardImage } from '../tasting-card-share';

const ref = { current: { id: 'view' } } as any;

describe('shareTastingCardImage', () => {
  beforeEach(() => {
    mockCaptureRef.mockReset().mockResolvedValue('file:///cache/card.png');
    mockReleaseCapture.mockReset();
    mockIsAvailableAsync.mockReset().mockResolvedValue(true);
    mockShareAsync.mockReset().mockResolvedValue(undefined);
  });

  test('zapisuje PNG do pliku tymczasowego i udostępnia go', async () => {
    await shareTastingCardImage(ref, 'Karta');
    expect(mockCaptureRef).toHaveBeenCalledWith(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    expect(mockShareAsync).toHaveBeenCalledWith('file:///cache/card.png', {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Karta',
    });
    expect(mockReleaseCapture).toHaveBeenCalledWith('file:///cache/card.png');
  });

  test('bez wyrenderowanego widoku zgłasza błąd', async () => {
    await expect(shareTastingCardImage({ current: null } as any, 'Karta')).rejects.toThrow('nie jest wyrenderowana');
    expect(mockCaptureRef).not.toHaveBeenCalled();
  });

  test('bez dostępnego udostępniania zgłasza błąd przed zapisem', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);
    await expect(shareTastingCardImage(ref, 'Karta')).rejects.toThrow('niedostępne');
    expect(mockCaptureRef).not.toHaveBeenCalled();
  });

  test('błąd udostępnienia zwalnia plik tymczasowy i przekazuje błąd dalej', async () => {
    mockShareAsync.mockRejectedValue(new Error('anulowano'));
    await expect(shareTastingCardImage(ref, 'Karta')).rejects.toThrow('anulowano');
    expect(mockReleaseCapture).toHaveBeenCalledWith('file:///cache/card.png');
  });
});
