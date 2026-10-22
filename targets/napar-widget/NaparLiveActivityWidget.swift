// ============================================================================
// Napar (Steepwise) — Widoki Live Activity: ekran blokady i Dynamic Island.
// Odliczanie działa natywnie (Text(timerInterval:)), więc nie wymaga odświeżania przez aplikację.
// VoiceOver czyta nazwę przepisu, nazwę etapu, numer zalania i czas (children: .combine).
// ============================================================================

import ActivityKit
import SwiftUI
import WidgetKit

/// Napisy z Localizable.strings widżetu w języku aktywności (zapas: język angielski).
enum NaparStrings {
  static func pourOf(_ index: Int, _ total: Int, language: String) -> String {
    let template = String(
      localized: "live.pourOf",
      bundle: .main,
      locale: Locale(identifier: language)
    )
    return String(format: template, index, total)
  }

  static func paused(language: String) -> String {
    return String(localized: "live.paused", bundle: .main, locale: Locale(identifier: language))
  }
}

/// Czas do końca etapu: liczony natywnie w biegu, stały w pauzie.
/// Zaokrąglenie w górę zgodne z aplikacją (remainingTimerSec).
func naparFormatSeconds(milliseconds: Double) -> String {
  let total = max(0, Int((milliseconds / 1000).rounded(.up)))
  return String(format: "%ld:%02ld", total / 60, total % 60)
}

struct NaparTimerText: View {
  let state: NaparTimerAttributes.ContentState

  var body: some View {
    if state.isPaused {
      Text(naparFormatSeconds(milliseconds: state.pausedRemainingMs))
        .monospacedDigit()
    } else {
      let end = Date(timeIntervalSince1970: state.endAtMs / 1000)
      Text(timerInterval: Date.now...max(end, Date.now), countsDown: true)
        .monospacedDigit()
    }
  }
}

func naparSymbol(for beverageType: String) -> String {
  return beverageType == "TEA" ? "leaf.fill" : "cup.and.saucer.fill"
}

struct NaparLockScreenView: View {
  let attributes: NaparTimerAttributes
  let state: NaparTimerAttributes.ContentState

  var body: some View {
    let language = attributes.language
    HStack(spacing: 12) {
      Image(systemName: naparSymbol(for: attributes.beverageType))
        .font(.title2)
        .accessibilityHidden(true)
      VStack(alignment: .leading, spacing: 4) {
        Text(attributes.recipeName)
          .font(.caption)
          .lineLimit(1)
        Text(state.stepName)
          .font(.headline)
          .lineLimit(1)
        HStack(spacing: 6) {
          Text(NaparStrings.pourOf(state.pourIndex, state.pourTotal, language: language))
            .font(.caption)
          if state.isPaused {
            Text(NaparStrings.paused(language: language))
              .font(.caption.weight(.semibold))
          }
        }
      }
      Spacer(minLength: 8)
      NaparTimerText(state: state)
        .font(.system(size: 34, weight: .semibold, design: .rounded))
    }
    .padding(16)
    .accessibilityElement(children: .combine)
  }
}

struct NaparTimerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NaparTimerAttributes.self) { context in
      NaparLockScreenView(attributes: context.attributes, state: context.state)
    } dynamicIsland: { context in
      let language = context.attributes.language
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: naparSymbol(for: context.attributes.beverageType))
            .accessibilityHidden(true)
        }
        DynamicIslandExpandedRegion(.trailing) {
          NaparTimerText(state: context.state)
            .font(.title2.weight(.semibold))
        }
        DynamicIslandExpandedRegion(.center) {
          VStack(spacing: 2) {
            Text(context.state.stepName)
              .font(.headline)
              .lineLimit(1)
            Text(NaparStrings.pourOf(context.state.pourIndex, context.state.pourTotal, language: language))
              .font(.caption)
          }
          .accessibilityElement(children: .combine)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text(context.attributes.recipeName)
            .font(.caption)
            .lineLimit(1)
        }
      } compactLeading: {
        Image(systemName: naparSymbol(for: context.attributes.beverageType))
          .accessibilityHidden(true)
      } compactTrailing: {
        NaparTimerText(state: context.state)
          .frame(maxWidth: 52)
      } minimal: {
        Image(systemName: naparSymbol(for: context.attributes.beverageType))
          .accessibilityHidden(true)
      }
    }
  }
}
