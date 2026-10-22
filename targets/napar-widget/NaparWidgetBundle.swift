// ============================================================================
// Napar (Steepwise) — Pakiet widżetów: wyłącznie Live Activity stoptera parzenia.
// ============================================================================

import SwiftUI
import WidgetKit

@main
struct NaparWidgetBundle: WidgetBundle {
  var body: some Widget {
    NaparTimerLiveActivity()
  }
}
