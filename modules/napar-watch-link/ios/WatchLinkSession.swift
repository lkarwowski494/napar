// ============================================================================
// Napar (Steepwise) — Sesja WCSession po stronie iPhone'a.
// Stan stoptera idzie przez applicationContext (zegarek dostaje zawsze ostatni stan).
// Polecenia z zegarka (sendMessage, pole "cmd") trafiają do onCommand na głównym wątku.
// Bez WCSession (iPad, brak sparowanego zegarka) wszystkie wywołania zwracają false.
// ============================================================================

import Foundation
import WatchConnectivity

final class WatchLinkSession: NSObject, WCSessionDelegate {
  static let shared = WatchLinkSession()

  /// Ustawiane przez moduł Expo; wywoływane na głównym wątku z nazwą polecenia.
  var onCommand: ((String) -> Void)?

  private override init() {
    super.init()
  }

  func activate() -> Bool {
    guard WCSession.isSupported() else { return false }
    let session = WCSession.default
    session.delegate = self
    session.activate()
    return true
  }

  func sendState(_ payload: [String: Any]) -> Bool {
    guard let session = readySession() else { return false }
    do {
      try session.updateApplicationContext(payload)
      return true
    } catch {
      return false
    }
  }

  /// Stan „idle” zastępuje poprzedni stan na zegarku (ekran „brak parzenia”).
  func clearState() -> Bool {
    return sendState(["v": 1, "phase": "idle"])
  }

  private func readySession() -> WCSession? {
    guard WCSession.isSupported() else { return nil }
    let session = WCSession.default
    guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else {
      return nil
    }
    return session
  }

  // MARK: WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}

  func sessionDidBecomeInactive(_ session: WCSession) {}

  /// Po przełączeniu zegarka trzeba aktywować sesję ponownie.
  func sessionDidDeactivate(_ session: WCSession) {
    WCSession.default.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    deliver(message)
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    deliver(message)
    replyHandler(["ok": true])
  }

  private func deliver(_ message: [String: Any]) {
    guard let command = message["cmd"] as? String else { return }
    DispatchQueue.main.async { [weak self] in
      self?.onCommand?(command)
    }
  }
}
