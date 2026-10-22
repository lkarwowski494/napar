// ============================================================================
// Napar (Steepwise) — Atrybuty Live Activity stoptera parzenia.
// UWAGA: ta sama treść jest w targets/napar-widget/NaparTimerAttributes.swift.
// ActivityKit wiąże aplikację z widżetem po nazwie typu, więc oba pliki muszą
// być identyczne (pilnuje tego tests/napar-live-activity.test.ts).
// ============================================================================

import ActivityKit

struct NaparTimerAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var stepName: String
    /// Koniec bieżącego etapu (epoch ms). 0 podczas pauzy.
    var endAtMs: Double
    /// Numer zalania od 1.
    var pourIndex: Int
    var pourTotal: Int
    var isPaused: Bool
    /// Pozostały czas etapu przy pauzie (ms). 0, gdy timer biegnie.
    var pausedRemainingMs: Double
  }

  var recipeName: String
  /// "COFFEE" albo "TEA".
  var beverageType: String
  /// "pl" albo "en".
  var language: String
}
