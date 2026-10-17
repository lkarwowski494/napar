// ============================================================================
// Napar (Steepwise) — Theme & Visual Constants
// Calm, artisanal aesthetic (Apps4Brew: warm copper, tea emerald, deep slate)
// ============================================================================

export const theme = {
  colors: {
    bg: '#121214',
    bgCard: '#1C1C1F',
    bgCardSecondary: '#242428',
    border: '#2E2E34',
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
    textPrimary: '#F4EFEA',
    textSecondary: '#A09C96',
    textMuted: '#8C8884',
    
    // Statusy i świeżość (Resting window)
    statusPeak: '#4E9F3D',
    statusPeakMuted: 'rgba(78, 159, 61, 0.15)',
    statusDegassing: '#D97736',
    statusStable: '#3D84A8',
    statusAging: '#787880',
    
    danger: '#D9534F',
    dangerMuted: 'rgba(217, 83, 79, 0.15)',
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
  },
};
