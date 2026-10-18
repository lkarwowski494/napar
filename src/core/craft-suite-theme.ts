// ============================================================================
// Apps4Craft Unified Design System — Multi-App Theme Tokens
// Shared foundation for the 5-app culinary craft family:
// ☕ Napar (Kawa/Herbata) · 🥖 Piekarz (Chleb/Zakwas) · 🫙 Słoik (Kiszonki/Przetwory)
// 🥩 Masaż (Wędliny/Peklowanie) · 🧀 Ferment (Sery rzemieślnicze)
// ============================================================================

export type CraftAppId = 'napar' | 'piekarz' | 'sloik' | 'masaz' | 'ferment';

export interface CraftAppTheme {
  id: CraftAppId;
  name: string;
  domain: string;
  accent: string;
  accentLight: string;
  accentMuted: string;
  secondaryAccent: string;
  heroDescriptor: string;
}

export const CRAFT_APPS: Record<CraftAppId, CraftAppTheme> = {
  napar: {
    id: 'napar',
    name: 'Napar',
    domain: 'Kawa & Herbata (Ekstrakcja)',
    accent: '#C86A28', // Warm Copper
    accentLight: '#E5A96A', // Crema Gold
    accentMuted: 'rgba(200, 106, 40, 0.15)',
    secondaryAccent: '#2A7B62', // Tea Emerald
    heroDescriptor: 'Czas parzenia i przepływ wody',
  },
  piekarz: {
    id: 'piekarz',
    name: 'Piekarz',
    domain: 'Chleb, Zakwas & Hydratacja',
    accent: '#D49B42', // Golden Crust
    accentLight: '#EDE4D0', // Rye Flour
    accentMuted: 'rgba(212, 155, 66, 0.15)',
    secondaryAccent: '#8C6239', // Toasted Malt
    heroDescriptor: 'Hydratacja i harmonogram fermentacji',
  },
  sloik: {
    id: 'sloik',
    name: 'Słoik',
    domain: 'Kiszonki, Solanki & Fermentacja warzyw',
    accent: '#5B8A61', // Dill Herb Green
    accentLight: '#D9E8D2', // Pure Brine
    accentMuted: 'rgba(91, 138, 97, 0.15)',
    secondaryAccent: '#9E8747', // Mustard Seed
    heroDescriptor: 'Stężenie solanki i czas dojrzewania',
  },
  masaz: {
    id: 'masaz',
    name: 'Masaż',
    domain: 'Wędliny, Peklowanie & Sezonowanie mięsa',
    accent: '#A43E38', // Smoked Hickory Red
    accentLight: '#E06D53', // Paprika Rosa
    accentMuted: 'rgba(164, 62, 56, 0.15)',
    secondaryAccent: '#5C241E', // Charcoal Smoke
    heroDescriptor: 'Kalkulator peklosoli i ubytek masy',
  },
  ferment: {
    id: 'ferment',
    name: 'Ferment',
    domain: 'Sery Rzemieślnicze & Dojrzewalnia',
    accent: '#E0A838', // Aged Gouda Gold
    accentLight: '#F4EED8', // Curd Cream
    accentMuted: 'rgba(224, 168, 56, 0.15)',
    secondaryAccent: '#3B6B55', // Sage Cheese Leaf
    heroDescriptor: 'Podpuszczka, pH i wilgotność skórki',
  },
};

export const sharedCraftTokens = {
  colors: {
    bgBasalt: '#121214',
    bgCard: '#1C1C1F',
    bgCardSecondary: '#242428',
    border: '#2E2E34',
    borderLight: '#3E3E46',
    textPrimary: '#F4EFEA',
    textSecondary: '#A09C96',
    textMuted: '#8C8884',
    danger: '#D9534F',
    dangerMuted: 'rgba(217, 83, 79, 0.15)',
    statusSuccess: '#4E9F3D',
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
  touchTargetMin: 48,
  buttonHeightMin: 52,
  hitSlopStandard: { top: 12, bottom: 12, left: 12, right: 12 },
  typography: {
    displayHero: {
      fontSize: 48,
      fontWeight: '700' as const,
      letterSpacing: -1,
      color: '#F4EFEA',
    },
    displayLarge: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      color: '#F4EFEA',
    },
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: '#F4EFEA',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#A09C96',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#F4EFEA',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: '#8C8884',
    },
    monoNumber: {
      fontVariant: ['tabular-nums' as const],
      fontWeight: '700' as const,
    },
  },
};

export function getCraftTheme(appId: CraftAppId = 'napar'): CraftAppTheme {
  return CRAFT_APPS[appId] ?? CRAFT_APPS.napar;
}
