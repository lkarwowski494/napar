// ============================================================================
// Napar (Steepwise) — Synchronizacja stoptera z Apple Watch (WatchConnectivity).
// Komponent bez widoku, montowany w układzie głównym (app/_layout.tsx). Wysyła stan przy zmianach
// (etap, pauza, wznowienie, koniec), a polecenia z zegarka (pause / resume / next) przekazuje do stopera.
// Decyzje są w core/watch-state.ts; tutaj tylko podłączenie do mostu i do kontekstu parzenia.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useBrew } from '../core/brew-context';
import { useTranslation } from '../core/i18n';
import {
  buildWatchState,
  createWatchSyncController,
  decideWatchCommand,
  parseWatchCommand,
  watchLanguage,
  WatchTransport,
} from '../core/watch-state';
import {
  activateWatchLink,
  clearWatchState,
  sendWatchState,
  subscribeWatchCommands,
} from '../../modules/napar-watch-link';

const nativeTransport: WatchTransport = {
  sendState: (payload) => sendWatchState(payload),
  clearState: () => clearWatchState(),
};

export function WatchSync(): null {
  const { snapshot, pauseTimer, resumeTimer, nextStep } = useBrew();
  const { language } = useTranslation();
  const [controller] = useState(() => createWatchSyncController(nativeTransport));
  const lang = watchLanguage(language);

  // Ostatnie wartości dla nasłuchu poleceń: zdarzenie z zegarka działa na bieżącym stanie, nie na starym.
  const latest = useRef({ snapshot, pauseTimer, resumeTimer, nextStep });
  latest.current = { snapshot, pauseTimer, resumeTimer, nextStep };

  useEffect(() => {
    void activateWatchLink();
    return subscribeWatchCommands((event) => {
      const cmd = parseWatchCommand(event);
      if (cmd === null) return;
      const action = decideWatchCommand(cmd, latest.current.snapshot.status);
      if (action === 'pause') latest.current.pauseTimer();
      else if (action === 'resume') latest.current.resumeTimer();
      else if (action === 'next') latest.current.nextStep();
    });
  }, []);

  useEffect(() => {
    void controller.sync(buildWatchState(snapshot, Date.now(), lang));
  }, [controller, snapshot, lang]);

  return null;
}
