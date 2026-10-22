// ============================================================================
// Napar (Steepwise) — Most ActivityKit dla Live Activity stoptera parzenia.
// Funkcje JS: start / update / end / endAll. Błędy nie są rzucane: zwracane są nil / false,
// a warstwa JS traktuje to jak brak aktywności (parzenie trwa dalej w aplikacji).
// ============================================================================

import ActivityKit
import ExpoModulesCore

/// Pola startu: atrybuty aktywności i pierwszy stan. Nazwy muszą zgadzać się z JS (NativeStartPayload).
struct StartRecord: Record {
  @Field var recipeName: String = ""
  @Field var beverageType: String = "COFFEE"
  @Field var language: String = "pl"
  @Field var stepName: String = ""
  @Field var endAtMs: Double = 0
  @Field var pourIndex: Int = 1
  @Field var pourTotal: Int = 1
  @Field var isPaused: Bool = false
  @Field var pausedRemainingMs: Double = 0
}

/// Pola samego stanu (NativeContentPayload).
struct ContentRecord: Record {
  @Field var stepName: String = ""
  @Field var endAtMs: Double = 0
  @Field var pourIndex: Int = 1
  @Field var pourTotal: Int = 1
  @Field var isPaused: Bool = false
  @Field var pausedRemainingMs: Double = 0
}

@available(iOS 16.2, *)
private func makeState(
  stepName: String,
  endAtMs: Double,
  pourIndex: Int,
  pourTotal: Int,
  isPaused: Bool,
  pausedRemainingMs: Double
) -> NaparTimerAttributes.ContentState {
  return NaparTimerAttributes.ContentState(
    stepName: stepName,
    endAtMs: endAtMs,
    pourIndex: pourIndex,
    pourTotal: pourTotal,
    isPaused: isPaused,
    pausedRemainingMs: pausedRemainingMs
  )
}

@available(iOS 16.2, *)
private func findActivity(_ id: String) -> Activity<NaparTimerAttributes>? {
  return Activity<NaparTimerAttributes>.activities.first { $0.id == id }
}

@available(iOS 16.2, *)
private func endEverything() async {
  for activity in Activity<NaparTimerAttributes>.activities {
    await activity.end(nil, dismissalPolicy: .immediate)
  }
}

public class NaparLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NaparLiveActivity")

    AsyncFunction("start") { (record: StartRecord) async -> String? in
      guard #available(iOS 16.2, *) else { return nil }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return nil }
      // Jedna aktywność naraz: pozostałości po poprzednim uruchomieniu znikają przed startem.
      await endEverything()
      let attributes = NaparTimerAttributes(
        recipeName: record.recipeName,
        beverageType: record.beverageType,
        language: record.language
      )
      let state = makeState(
        stepName: record.stepName,
        endAtMs: record.endAtMs,
        pourIndex: record.pourIndex,
        pourTotal: record.pourTotal,
        isPaused: record.isPaused,
        pausedRemainingMs: record.pausedRemainingMs
      )
      do {
        let activity = try Activity<NaparTimerAttributes>.request(
          attributes: attributes,
          content: ActivityContent(state: state, staleDate: nil),
          pushType: nil
        )
        return activity.id
      } catch {
        return nil
      }
    }

    AsyncFunction("update") { (activityId: String, record: ContentRecord) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      guard let activity = findActivity(activityId) else { return false }
      let state = makeState(
        stepName: record.stepName,
        endAtMs: record.endAtMs,
        pourIndex: record.pourIndex,
        pourTotal: record.pourTotal,
        isPaused: record.isPaused,
        pausedRemainingMs: record.pausedRemainingMs
      )
      await activity.update(ActivityContent(state: state, staleDate: nil))
      return true
    }

    AsyncFunction("end") { (activityId: String) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      guard let activity = findActivity(activityId) else { return false }
      await activity.end(nil, dismissalPolicy: .immediate)
      return true
    }

    AsyncFunction("endAll") { () async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      await endEverything()
      return true
    }
  }
}
