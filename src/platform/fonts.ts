// ============================================================================
// Napar — czcionki zależne od platformy (M1-audytor-generalny-045, 05-architekt-012)
// Wydzielone z src/core/theme.ts bez zmiany wartości: tokeny motywu w src/core
// nie importują react-native (CLAUDE.md §2.1).
// ============================================================================

import { Platform } from 'react-native';

/** Krój o stałej szerokości: Menlo na iOS, systemowy `monospace` gdzie indziej. */
export const MONOSPACE_FONT_FAMILY = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
