// ============================================================================
// Napar (Steepwise) — Klient WatchConnectivity po stronie zegarka.
// Odbiera ostatni stan z applicationContext, wysyła polecenia (pause / resume / next) przez sendMessage,
// a przy zmianie etapu i na koniec daje krótką wibrację (WKInterfaceDevice).
// Wszystkie zmiany @Published idą na głównym wątku.
// ============================================================================

import Foundation
import WatchConnectivity
import WatchKit

final class WatchLinkClient: NSObject, ObservableObject, WCSessionDelegate {
  /// nil = brak parzenia (bezczynny stoper w aplikacji).
  @Published private(set) var state: NaparWatchState?
  @Published private(set) var isPhoneReachable = false

  override init() {
    super.init()
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()
  }

  /// Wysyła polecenie do iPhone'a. Gdy iPhone nie odpowiada, nic nie wysyła i zwraca false.
  @discardableResult
  func send(_ command: String) -> Bool {
    let session = WCSession.default
    guard session.activationState == .activated, session.isReachable else {
      isPhoneReachable = false
      return false
    }
    session.sendMessage(["cmd": command], replyHandler: nil) { [weak self] _ in
      DispatchQueue.main.async { self?.isPhoneReachable = false }
    }
    return true
  }

  private func apply(_ next: NaparWatchState?) {
    let previous = state
    state = next
    guard let previous = previous, let next = next else { return }
    if next.phase == .finished {
      if previous.phase != .finished {
        WKInterfaceDevice.current().play(.success)
      }
    } else if next.pourIndex != previous.pourIndex {
      WKInterfaceDevice.current().play(.notification)
    }
  }

  // MARK: WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    let context = session.receivedApplicationContext
    let reachable = session.isReachable
    DispatchQueue.main.async {
      self.isPhoneReachable = reachable
      self.apply(NaparWatchState.from(context: context))
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    let next = NaparWatchState.from(context: applicationContext)
    DispatchQueue.main.async {
      self.apply(next)
    }
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    let reachable = session.isReachable
    DispatchQueue.main.async {
      self.isPhoneReachable = reachable
    }
  }
}
