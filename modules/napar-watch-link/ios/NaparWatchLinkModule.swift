// ============================================================================
// Napar (Steepwise) — Most Expo do WatchConnectivity (iPhone) dla zegarka.
// Funkcje JS: activate / sendState / clearState, zdarzenie onWatchCommand (pole cmd).
// Błędy nie są rzucane: zwracane jest false, a warstwa JS traktuje to jak brak zegarka.
// ============================================================================

import ExpoModulesCore

/// Pola stanu. Nazwy muszą zgadzać się z JS (NativeWatchPayload) i z kluczami wiadomości do zegarka.
struct StateRecord: Record {
  @Field var v: Int = 1
  @Field var phase: String = "brewing"
  @Field var stepName: String = ""
  @Field var endAtMs: Double = 0
  @Field var pausedRemainingMs: Double = 0
  @Field var pourIndex: Int = 1
  @Field var pourTotal: Int = 1
  @Field var language: String = "pl"
}

private func payloadDictionary(_ record: StateRecord) -> [String: Any] {
  return [
    "v": record.v,
    "phase": record.phase,
    "stepName": record.stepName,
    "endAtMs": record.endAtMs,
    "pausedRemainingMs": record.pausedRemainingMs,
    "pourIndex": record.pourIndex,
    "pourTotal": record.pourTotal,
    "language": record.language,
  ]
}

public class NaparWatchLinkModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NaparWatchLink")

    Events("onWatchCommand")

    OnCreate {
      WatchLinkSession.shared.onCommand = { [weak self] command in
        self?.sendEvent("onWatchCommand", ["cmd": command])
      }
    }

    AsyncFunction("activate") { () -> Bool in
      return WatchLinkSession.shared.activate()
    }

    AsyncFunction("sendState") { (record: StateRecord) -> Bool in
      return WatchLinkSession.shared.sendState(payloadDictionary(record))
    }

    AsyncFunction("clearState") { () -> Bool in
      return WatchLinkSession.shared.clearState()
    }
  }
}
