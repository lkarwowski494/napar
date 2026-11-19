# Notatki dla App Review — Napar 1.0.0

Treść pola *App Review Information → Notes* w App Store Connect dla wersji z `app.json` (`expo.version`). Blok `text` poniżej wkleja się bez zmian; musi mieć mniej niż 4000 B (limit pola). Źródło: 10-wydanie-011, M1-audytor-generalny-040; kontrola: `tests/audit-fixes.test.tsx`, blok „M1-audytor-generalny-040”.

Fakty pochodzą z kodu i dokumentów repozytorium:

| Twierdzenie w notatkach | Źródło |
| :--- | :--- |
| bez konta, logowania, serwera i analityki | `site/privacy.html` §1; `app.json` (`NSPrivacyTracking: false`, brak zbieranych typów danych) |
| bez zakupów i płatnych treści | D-001 (DEC-01) w `docs/decyzje.md`; `docs/scope-contract.md` F-34 (PÓŹNIEJ, kod usunięty) |
| języki polski i angielski, domyślnie z ustawień systemu | D-003 (DEC-03, zadanie 032); `app.json` `CFBundleLocalizations` |
| aparat tylko do kodów QR z przepisem | `app.json` `NSCameraUsageDescription`; `site/privacy.html` §3 |
| bez integracji ze Zdrowiem | D-004, KILL-08 (zadanie 021) |
| bez powiadomień; sygnał dźwiękiem i wibracją na pierwszym planie | D-008, KILL-09 (zadanie 035) |
| szacunek kofeiny z zastrzeżeniem medycznym | `docs/scope-contract.md` F-16, F-17; D-005 |
| tryb awaryjny po 3 nieudanych startach albo błędzie otwarcia bazy | `src/data/startup-guard.ts` (`SAFE_MODE_THRESHOLD = 3`), `app/_layout.tsx`, `src/components/SafeModeView.tsx` |
| etykiety przycisków | słownik `translations.en` w `src/core/i18n.tsx`; „Finish & Save” w `src/components/brew/ProcedureModal.tsx` |

Przed wysłaniem do przeglądu: sprawdzić, że wersja w nagłówku bloku zgadza się z `app.json` (adres kontaktowy wpisany: DEC-07 / `KO-002`).

```text
Napar 1.0.0 - notes for App Review

ACCESS
- No account, no login and no demo credentials needed. The app works fully offline: there is no server, no analytics and no ads. All data stays on the device.
- No in-app purchases and no paid content: every feature is available on first launch.
- Languages: Polish and English. The app follows the device language; it can be changed in Settings > Language.
- Camera: used only to scan a recipe QR code, after the user taps the QR button. Nothing is recorded or stored.
- The app does not integrate with the Health app and does not send notifications. During a brew, step changes are signalled with sound and vibration while the app is in the foreground, and the screen stays awake.

MAIN FLOW (brew > rating > journal), about 3 minutes
1. On first launch answer one question (coffee, tea or both). Settings > How it works? shows the same guide later.
2. On the Brew tab tap "Show brew steps", then "START BREWING". The timer starts only after this tap.
3. Use "Next Step" to move through the pours; on the last step tap "Finish & Save".
4. The rating sheet opens. Tap the stars, optionally pick a taste and flavour notes, then tap "Save to Journal" in the top right corner.
5. Open the Journal tab: the brew is listed. "Brew Again" loads the same recipe on the Brew tab.

RECIPE SHARING WITH QR OR LINK (no second device needed)
1. On the Brew tab tap the SHARE pill. A QR code with the recipe is shown.
2. Tap "Share link..." and choose Copy in the iOS share sheet.
3. Open the recipe list (RECIPE pill), tap "Import (QR / Link)", paste the link and confirm the import.
To test the scanner, tap QR in the recipe list and point the camera at the QR code shown on another screen.

OTHER AREAS
- Stash tab: coffee and tea packages; when a package is selected for a brew, the dose is subtracted after saving.
- Dial-in tab: ratio, extraction, water and grinder calculators, and the Caffeine card. Caffeine values are an informational estimate from an elimination model, shown with a medical disclaimer; the app gives no medical advice.
- Settings: JSON backup export and import, CSV export of the journal, units and language.

SAFE MODE
If the app fails to start three times in a row or the database cannot be opened, it starts in safe mode instead of the normal screens. Safe mode lets the user export a rescue copy of the database and try a normal start again. It does not appear in normal use.

CONTACT
support@apps4brew.com
```
