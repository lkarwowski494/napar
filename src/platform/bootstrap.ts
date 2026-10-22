// ============================================================================
// Napar (Steepwise) — Podłączenie adapterów platformy do warstwy core.
// Importowane raz, na starcie aplikacji (app/_layout.tsx).
// ============================================================================

import { configureDatabase } from '../core/database';
import { configureBackupStorage } from '../core/backup';
import { configureStoreAdapter } from '../core/store-port';
import { openNaparDatabase } from './sqlite-adapter';
import { expoBackupStorage } from './backup-storage';
import { selectStoreAdapter } from './store';

configureDatabase(openNaparDatabase);
configureBackupStorage(expoBackupStorage);
configureStoreAdapter(selectStoreAdapter(process.env.EXPO_PUBLIC_STORE_FAKE));
