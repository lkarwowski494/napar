#!/usr/bin/env bash
# Sprawdza czy platforma iOS zgodna z SDK wybranego Xcode jest zainstalowana.
set -euo pipefail
SDK="$(xcrun --sdk iphoneos --show-sdk-version)"
echo "SDK iOS wybranego Xcode: ${SDK}"
if xcrun simctl list runtimes | grep -Eq "iOS ${SDK//./\\.}( |\.)"; then
  echo "Platforma iOS ${SDK} jest zainstalowana — bez pobierania."
else
  echo "Brak platformy iOS ${SDK} — pobieram (xcodebuild -downloadPlatform iOS)."
  sudo xcodebuild -downloadPlatform iOS
fi
xcrun simctl list runtimes
