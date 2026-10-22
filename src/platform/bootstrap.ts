// ============================================================================
// Napar (Steepwise) — Podłączenie adapterów platformy do warstwy core.
// Importowane raz, na starcie aplikacji (app/_layout.tsx).
// ============================================================================

import { configureDatabase } from '../core/database';
import { configureBackupStorage } from '../core/backup';
import { openNaparDatabase } from './sqlite-adapter';
import { expoBackupStorage } from './backup-storage';

configureDatabase(openNaparDatabase);
configureBackupStorage(expoBackupStorage);
