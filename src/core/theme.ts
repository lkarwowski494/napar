// ============================================================================
// Napar — Theme & Visual Constants
// Calm, artisanal aesthetic (Apps4Brew: warm copper, tea emerald, deep slate)
// ============================================================================

import { MONOSPACE_FONT_FAMILY } from '../platform/fonts';

/**
 * M1-audytor-generalny-042: kolor tokenu z przezroczystością — `withAlpha(theme.colors.copper, 0.12)`
 * daje `rgba(217, 119, 54, 0.12)`. Ekrany nie wpisują liczb rgba() same.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const theme = {
  lightColors: {
    bg: '#FBF9F6',
    bgCard: '#FFFFFF',
    bgCardSecondary: '#F2EFEB',
    border: '#E2DDD6',
    borderLight: '#ECE7E1',
    copper: '#B85D20',
    copperLight: '#D97736',
    copperMuted: 'rgba(184, 93, 32, 0.12)',
    emerald: '#1F614D',
    emeraldLight: '#2A7B62',
    emeraldMuted: 'rgba(31, 97, 77, 0.12)',
    sage: '#3B7A2E',
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    textMuted: '#78716C',
    statusPeak: '#3B7A2E',
    statusPeakMuted: 'rgba(59, 122, 46, 0.12)',
    statusDegassing: '#B85D20',
    statusStable: '#2B6684',
    statusAging: '#78716C',
    danger: '#B91C1C',
    dangerMuted: 'rgba(185, 28, 28, 0.12)',
  },
  colors: {
    bg: '#121214',
    bgCard: '#1C1C1F',
    bgCardSecondary: '#242428',
    border: '#2E2E34',
    // M1-audytor-generalny-028: obrys elementów interfejsu (pola, chipy, puste gwiazdki) ≥ 3:1 na bg, bgCard i bgCardSecondary
    borderStrong: '#76767F',
    borderLight: '#3E3E46',
    
    // Akcenty rzemieślnicze
    copper: '#D97736',
    copperLight: '#E88B4D',
    copperMuted: 'rgba(217, 119, 54, 0.15)',
    
    emerald: '#2A7B62',
    emeraldLight: '#3AA584',
    emeraldMuted: 'rgba(42, 123, 98, 0.15)',
    sage: '#4E9F3D',
    
    // Teksty
    white: '#FFFFFF',
    // M1-audytor-generalny-028: tekst na wypełnionej miedzi i czerwieni (5,92:1 na copper; biały dawał 3,16:1)
    onAccent: '#121214',
    textPrimary: '#F4EFEA',
    textSecondary: '#A09C96',
    textMuted: '#96928E', // 028: było #8C8884 (4,40:1 na bgCardSecondary)
    
    // Statusy i świeżość (Resting window)
    statusPeak: '#4E9F3D',
    statusPeakMuted: 'rgba(78, 159, 61, 0.15)',
    statusDegassing: '#D97736',
    statusStable: '#3D84A8',
    statusAging: '#787880',
    
    danger: '#E5605B', // 028: było #D9534F (4,29:1 jako tekst na bgCard)
    dangerMuted: 'rgba(217, 83, 79, 0.15)',

    // M1-audytor-generalny-042 (04-studio-projektowe-014): kolory dotąd wpisane literałami w ekranach.
    // Wartości przeniesione 1:1 (bez scalania odcieni) — kontrast ekranów bez zmian; pary tekstowe
    // sprawdza tests/contrast-tokens.test.ts.
    black: '#000000', // cień, tło podglądu aparatu, moduły kodu QR
    copperBrand: '#C86A28', // miedź ikony aplikacji (ikony nawigacji, tła kart wyboru napoju)
    accentWarm: '#E5A96A', // ikony statystyk dziennika (kofeina, ocena)
    rating: '#FFD700', // aktywne gwiazdki i odznaka oceny
    favorite: '#E5A93C', // aktywne „ulubione” ziarna
    success: '#4CAF50', // porada „idealny balans”, oszczędność kosztu
    successBright: '#4ADE80', // stan ziarna w kompendium, przycisk Gongfu
    warning: '#D97706', // ekstrakcja poza zakresem (tło z przezroczystością)
    error: '#DC2626', // błąd pola, przycisk niszczący, obrys banera odzysku
    errorBannerBg: '#7F1D1D', // tło banera uszkodzonego stanu
    errorBannerAction: '#991B1B', // przycisk na banerze uszkodzonego stanu
    errorBannerTitle: '#FEE2E2', // tytuł na banerze uszkodzonego stanu
    errorBannerText: '#FECACA', // opis na banerze uszkodzonego stanu
    dangerIcon: '#D9534F', // domyślny kolor ikon kosza i płomienia, tła ostrzeżeń (baza dangerMuted)
    dangerBright: '#EF4444', // tło przycisku usuwania paczki (z przezroczystością)
    neutralTint: '#646464', // odznaka „po oknie odpoczynku” (z przezroczystością)
  },
  // Kolory rodziny aplikacji Apps4Craft (emblematy w CraftIcons) — barwy marek, nie stany interfejsu.
  familyColors: {
    napar: '#C86A28',
    piekarz: '#D49B42',
    sloik: '#5B8A61',
    masaz: '#A43E38',
    ferment: '#E0A838',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 18,
    full: 999,
  },
  typography: {
    title: {
      fontSize: 26,
      fontWeight: '700' as const,
      color: '#F4EFEA',
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#F4EFEA',
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: '#A09C96',
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: '#8C8884',
    },
    timerDisplay: {
      fontSize: 64,
      fontWeight: '300' as const,
      letterSpacing: -1,
      fontVariant: ['tabular-nums'] as any,
      color: '#F4EFEA',
    },
    monospace: MONOSPACE_FONT_FAMILY,
    code: {
      fontFamily: MONOSPACE_FONT_FAMILY,
      fontSize: 12,
      color: '#F4EFEA',
    },
  },
};
