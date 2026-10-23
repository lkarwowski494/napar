// ============================================================================
// Napar (Steepwise) — Teksty przeniesione z widoków do słowników (CLAUDE.md §2.3)
// Każdy klucz przeniesiony z `language === 'pl' ? ... : ...` istnieje w 35 słownikach
// i ma tekst niepusty. Komunikaty głosowe zachowują dotychczasową treść dla PL i EN.
// ============================================================================

import { getTranslations, translations } from '../src/core/i18n';
import { LANGS, LangCode } from '../src/core/i18n-loader';
import { formatFinishAnnouncement, formatStepAnnouncement, formatCountdownAnnouncement } from '../src/core/announce';

/** Klucze przeniesione z wbudowanych wyborów języka (ścieżki w locales/pl.json). */
const MIGRATED_KEYS = [
  'brewScreen.stepOneTitle',
  'brewScreen.stepTwoThreeTitle',
  'brewScreen.stepFourTitle',
  'brewScreen.procedureCtaTitle',
  'brewScreen.procedureCtaSub',
  'brewScreen.procedureCtaA11y',
  'brewScreen.corruptTitle',
  'brewScreen.corruptDesc',
  'brewScreen.corruptDismiss',
  'brewScreen.corruptDismissA11y',
  'brewScreen.goldenRules',
  'brewWorkflow.changeRecipeTitle',
  'brewWorkflow.changeRecipeMessage',
  'brewWorkflow.changeRecipeAction',
  'brewWorkflow.resetSessionTitle',
  'brewWorkflow.resetSessionMessage',
  'brewWorkflow.resetSessionAction',
  'procedure.eyebrow',
  'procedure.exitA11y',
  'procedure.stepCounter',
  'procedure.autoTimerTag',
  'procedure.pourToWeight',
  'procedure.timerRunning',
  'procedure.timerPaused',
  'procedure.totalBrewTime',
  'procedure.pauseBtn',
  'procedure.resumeBtn',
  'procedure.pauseA11y',
  'procedure.resumeA11y',
  'procedure.resetStepA11y',
  'procedure.resetStepBtn',
  'procedure.prevA11y',
  'procedure.prevBtn',
  'procedure.nextA11y',
  'procedure.nextBtn',
  'procedure.finishA11y',
  'procedure.finishBtn',
  'proactiveCalendar.title',
  'proactiveCalendar.scheduleTitle',
  'proactiveCalendar.showAllA11y',
  'proactiveCalendar.allDays',
  'proactiveCalendar.feedTitle',
  'proactiveCalendar.upcomingA11y',
  'proactiveCalendar.upcoming',
  'proactiveCalendar.allActionsA11y',
  'proactiveCalendar.allActions',
  'proactiveCalendar.executeA11y',
  'proactiveCalendar.executeBtn',
  'proactiveCalendar.icsA11y',
  'appGuide.title',
  'appGuide.closeA11y',
  'appGuide.gotIt',
  'appGuide.goldenRulesEyebrow',
  'appGuide.goldenRulesText',
  'appGuide.mainProcess',
  'appGuide.tabsTitle',
  'appGuide.step1Title',
  'appGuide.step1Desc',
  'appGuide.step2Title',
  'appGuide.step2Desc',
  'appGuide.step3Title',
  'appGuide.step3Desc',
  'appGuide.step4Title',
  'appGuide.step4Desc',
  'appGuide.tabBrew',
  'appGuide.tabBrewDesc',
  'appGuide.tabStash',
  'appGuide.tabStashDesc',
  'appGuide.tabJournal',
  'appGuide.tabJournalDesc',
  'appGuide.tabDialin',
  'appGuide.tabDialinDesc',
  'appGuide.tabSettings',
  'appGuide.tabSettingsDesc',
  'voice.stepAnnouncement',
  'voice.countdownAnnouncement',
  'voice.startAnnouncement',
  'voice.finishAnnouncement',
  'voice.minutesSeconds',
  'voice.secondsOnly',
  'craftFamily.title',
  'craftFamily.installed',
  'craftFamily.upcoming',
  'craftFamily.napar',
  'craftFamily.piekarz',
  'craftFamily.sloik',
  'craftFamily.masaz',
  'craftFamily.ferment',
  'settings.unitPreviewLabel',
  'settings.philosophyBadge',
  'settings.philosophyTitle',
  'settings.philosophyBody',
  'onboarding.changeAnytime',
  'caffeine.workshopSubtitle',
  'grinder.methodsPrefix',
  'grinder.micronsRangeText',
] as const;

const valueAt = (tree: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], tree);

describe('Teksty przeniesione do słowników (NFR-I18N-001)', () => {
  test.each(MIGRATED_KEYS)('klucz %s ma niepusty tekst w PL, EN i we wszystkich 35 językach', (path) => {
    expect(typeof valueAt(translations.pl, path)).toBe('string');
    expect(String(valueAt(translations.pl, path)).trim()).not.toBe('');
    expect(String(valueAt(translations.en, path)).trim()).not.toBe('');
    for (const lang of LANGS as readonly LangCode[]) {
      const value = valueAt(getTranslations(lang), path);
      expect(typeof value === 'string' && value.trim() !== '').toBe(true);
    }
  });

  test('komunikat zapowiedzi kroku: PL bez zmian, EN i pozostałe języki z tą samą strukturą', () => {
    expect(formatStepAnnouncement(1, 3, 'Parzenie', 50, 30, 'Zalej')).toBe(
      'Krok 1 z 3: Parzenie. Cel wody: 50 g. Czas trwania: 30 sekund. Zalej'
    );
    expect(formatStepAnnouncement(2, 4, 'Spłukanie', 100, 15)).toBe(
      'Krok 2 z 4: Spłukanie. Cel wody: 100 g. Czas trwania: 15 sekund.'
    );
    expect(formatStepAnnouncement(1, 3, 'Brew', 50, 30, 'Pour', 'en')).toBe(
      'Step 1 of 3: Brew. Target water: 50 g. Step duration: 30 seconds. Pour'
    );
    expect(formatStepAnnouncement(1, 3, 'Brew', 50, 30, undefined, 'de')).toBe(
      'Step 1 of 3: Brew. Target water: 50 g. Step duration: 30 seconds.'
    );
  });

  test('komunikat odliczania i zakończenia: minuty i sekundy w PL i EN', () => {
    expect(formatCountdownAnnouncement(3, 'pl')).toBe('3 sekundy do końca etapu.');
    expect(formatCountdownAnnouncement(3, 'en')).toBe('3 seconds remaining in this step.');
    expect(formatFinishAnnouncement('Espresso', 125, 'pl')).toBe(
      'Parzenie Espresso zakończone. Całkowity czas: 2 min 5 s. Smacznego!'
    );
    expect(formatFinishAnnouncement('Espresso', 45, 'en')).toBe(
      'Brewing of Espresso finished. Total time: 45 seconds. Enjoy your cup!'
    );
  });
});
