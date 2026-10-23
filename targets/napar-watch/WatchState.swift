// ============================================================================
// Napar (Steepwise) — Model stanu na zegarku i napisy PL / EN.
// Klucze słownika zgodne z toWatchPayload w src/core/watch-state.ts (kontrakt w tests/napar-watch-link.test.ts).
// ============================================================================

import Foundation

enum NaparWatchPhase: String {
  case brewing
  case paused
  case finished
}

struct NaparWatchState: Equatable {
  var phase: NaparWatchPhase
  var stepName: String
  /// Koniec etapu (epoch ms) podczas parzenia.
  var endAtMs: Double
  /// Pozostały czas etapu w pauzie (ms).
  var pausedRemainingMs: Double
  var pourIndex: Int
  var pourTotal: Int
  var language: String

  /// Zwraca nil dla stanu „idle” (brak parzenia) i dla słownika z nieznaną wersją lub fazą.
  static func from(context: [String: Any]) -> NaparWatchState? {
    if let version = context["v"] as? Int, version != 1 { return nil }
    guard let raw = context["phase"] as? String, let phase = NaparWatchPhase(rawValue: raw) else {
      return nil
    }
    return NaparWatchState(
      phase: phase,
      stepName: context["stepName"] as? String ?? "",
      endAtMs: context["endAtMs"] as? Double ?? 0,
      pausedRemainingMs: context["pausedRemainingMs"] as? Double ?? 0,
      pourIndex: context["pourIndex"] as? Int ?? 1,
      pourTotal: context["pourTotal"] as? Int ?? 1,
      language: context["language"] as? String ?? "pl"
    )
  }
}

/// Czas etapu jako m:ss. Zaokrąglenie w górę, jak w aplikacji (remainingTimerSec).
func naparFormatSeconds(milliseconds: Double) -> String {
  let total = max(0, Int((milliseconds / 1000).rounded(.up)))
  return String(format: "%ld:%02ld", total / 60, total % 60)
}

enum WatchStrings {
  /// Język z aplikacji iPhone (w stanie), a bez stanu język systemu zegarka (PL lub EN).
  static func language(for state: NaparWatchState?) -> String {
    if let state = state { return state.language }
    return Locale.current.language.languageCode?.identifier == "en" ? "en" : "pl"
  }

  /// Napis z katalogu lproj wskazanego języka. Brak klucza zwraca sam klucz (widoczny błąd, nie cisza).
  static func text(_ key: String, language: String) -> String {
    let bundle = lprojBundle(language) ?? Bundle.main
    return bundle.localizedString(forKey: key, value: nil, table: nil)
  }

  static func pourOf(_ index: Int, _ total: Int, language: String) -> String {
    return String(format: text("watch.pourOf", language: language), index, total)
  }

  private static func lprojBundle(_ language: String) -> Bundle? {
    guard let path = Bundle.main.path(forResource: language, ofType: "lproj") else { return nil }
    return Bundle(path: path)
  }
}
