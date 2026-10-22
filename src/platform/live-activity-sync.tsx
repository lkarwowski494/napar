// ============================================================================
// Napar (Steepwise) — Synchronizacja stoptera z Live Activity (ekran blokady, Dynamic Island).
// Komponent bez widoku: montowany w układzie głównym (app/_layout.tsx), więc aktywność
// nie znika przy zmianie zakładki. Logika decyzji jest w core/live-activity.ts.
// ============================================================================

import { useEffect, useState } from 'react';
import { useBrew } from '../core/brew-context';
import { useTranslation } from '../core/i18n';
import {
  buildLiveActivityContentState,
  createLiveActivityController,
  liveActivityLanguage,
  LiveActivityBridge,
} from '../core/live-activity';
import {
  endAllLiveActivities,
  endLiveActivity,
  startLiveActivity,
  updateLiveActivity,
} from '../../modules/napar-live-activity';

const nativeBridge: LiveActivityBridge = {
  start: (attributes, content) => startLiveActivity({ ...attributes, ...content }),
  update: (activityId, content) => updateLiveActivity(activityId, content),
  end: (activityId) => endLiveActivity(activityId),
};

export function LiveActivitySync(): null {
  const { snapshot, recipe } = useBrew();
  const { language } = useTranslation();
  const [controller] = useState(() => createLiveActivityController(nativeBridge));
  const lang = liveActivityLanguage(language);

  // Po starcie aplikacji nie ma działającego stoptera: aktywności z poprzedniego uruchomienia sprzątamy.
  useEffect(() => {
    void endAllLiveActivities();
  }, []);

  useEffect(() => {
    const content = buildLiveActivityContentState(snapshot, Date.now(), lang);
    void controller.sync(content, {
      recipeName: recipe.name,
      beverageType: 'beverageType' in recipe ? recipe.beverageType : recipe.type,
      language: lang,
    });
  }, [controller, snapshot, recipe, lang]);

  return null;
}
