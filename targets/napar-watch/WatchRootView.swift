// ============================================================================
// Napar (Steepwise) — Widoki zegarka: brak parzenia, parzenie / pauza, koniec.
// Przyciski mają min. 44 pt wysokości. Etykiety VoiceOver to napisy z lproj (grupa children: .combine).
// Odliczanie działa natywnie (Text(timerInterval:)), w pauzie pokazywany jest stały czas.
// ============================================================================

import SwiftUI

struct WatchRootView: View {
  @ObservedObject var client: WatchLinkClient

  var body: some View {
    if let state = client.state {
      BrewStateView(state: state, client: client)
    } else {
      IdleStateView()
    }
  }
}

struct IdleStateView: View {
  var body: some View {
    let language = WatchStrings.language(for: nil)
    VStack(spacing: 6) {
      Text(WatchStrings.text("watch.idle.title", language: language))
        .font(.headline)
      Text(WatchStrings.text("watch.idle.hint", language: language))
        .font(.footnote)
        .multilineTextAlignment(.center)
    }
    .padding()
    .accessibilityElement(children: .combine)
  }
}

struct BrewStateView: View {
  let state: NaparWatchState
  @ObservedObject var client: WatchLinkClient

  var body: some View {
    let language = state.language
    ScrollView {
      VStack(spacing: 8) {
        VStack(spacing: 4) {
          Text(state.stepName)
            .font(.headline)
            .lineLimit(2)
            .multilineTextAlignment(.center)
          Text(WatchStrings.pourOf(state.pourIndex, state.pourTotal, language: language))
            .font(.caption)
          if state.phase == .paused {
            Text(WatchStrings.text("watch.paused", language: language))
              .font(.caption.weight(.semibold))
          }
          if state.phase == .finished {
            Text(WatchStrings.text("watch.finished", language: language))
              .font(.headline)
          } else {
            WatchTimeText(state: state)
              .font(.system(size: 34, weight: .semibold, design: .rounded))
              .monospacedDigit()
          }
        }
        .accessibilityElement(children: .combine)

        if state.phase != .finished {
          controls(language: language)
        }

        if !client.isPhoneReachable {
          Text(WatchStrings.text("watch.phoneUnavailable", language: language))
            .font(.caption2)
            .foregroundColor(.secondary)
        }
      }
      .padding(.horizontal, 4)
    }
  }

  @ViewBuilder
  private func controls(language: String) -> some View {
    if state.phase == .paused {
      controlButton(WatchStrings.text("watch.resume", language: language), command: "resume", enabled: true)
    } else {
      controlButton(WatchStrings.text("watch.pause", language: language), command: "pause", enabled: true)
    }
    // Dalej tylko podczas parzenia (w pauzie iPhone odrzuca polecenie; patrz decideWatchCommand).
    controlButton(
      WatchStrings.text("watch.next", language: language),
      command: "next",
      enabled: state.phase == .brewing
    )
  }

  private func controlButton(_ title: String, command: String, enabled: Bool) -> some View {
    Button {
      client.send(command)
    } label: {
      Text(title)
        .frame(maxWidth: .infinity, minHeight: 44)
    }
    .buttonStyle(.bordered)
    .disabled(!enabled || !client.isPhoneReachable)
  }
}

struct WatchTimeText: View {
  let state: NaparWatchState

  var body: some View {
    if state.phase == .paused {
      Text(naparFormatSeconds(milliseconds: state.pausedRemainingMs))
    } else {
      let end = Date(timeIntervalSince1970: state.endAtMs / 1000)
      Text(timerInterval: Date.now...max(end, Date.now), countsDown: true)
    }
  }
}
