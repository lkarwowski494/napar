// ============================================================================
// Napar (Steepwise) — Aplikacja zegarka: stoper parzenia z iPhone'a.
// Zegarek nie czyta zdrowia (brak HealthKit). Stan i polecenia idą przez WatchConnectivity.
// ============================================================================

import SwiftUI

@main
struct NaparWatchApp: App {
  @StateObject private var client = WatchLinkClient()

  var body: some Scene {
    WindowGroup {
      WatchRootView(client: client)
    }
  }
}
