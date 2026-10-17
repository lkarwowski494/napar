#!/usr/bin/env bash
# Wybiera najwyższą zainstalowaną wersję Xcode o wskazanym numerze głównym (domyślnie 16)
# i weryfikuje, że SDK iOS pasuje do wymaganego numeru głównego (Rozdział 12.1 BRD-QA-REL 1.0).
set -euo pipefail

WANT_MAJOR="${1:-16}"

CANDIDATE=$(ls -d "/Applications/Xcode_${WANT_MAJOR}"*.app 2>/dev/null | sort -V | tail -n 1 || true)
if [ -z "$CANDIDATE" ] && [ -d "/Applications/Xcode.app" ]; then
  CANDIDATE="/Applications/Xcode.app"
fi

if [ -z "$CANDIDATE" ] || [ ! -d "$CANDIDATE" ]; then
  echo "::error::Nie znaleziono instalacji Xcode ${WANT_MAJOR}.x w /Applications:" >&2
  ls -d /Applications/Xcode*.app 2>/dev/null >&2 || true
  exit 1
fi

sudo xcode-select -s "$CANDIDATE/Contents/Developer"
xcodebuild -version

SDK_VER=$(xcodebuild -version -sdk iphoneos ProductVersion 2>/dev/null || echo "")
SDK_MAJOR="${SDK_VER%%.*}"
echo "Wybrano Xcode: $CANDIDATE (iOS SDK: ${SDK_VER:-nieznane})"

if [ "$SDK_MAJOR" != "$WANT_MAJOR" ]; then
  echo "::error::Wymagane iOS ${WANT_MAJOR} SDK, a wybrano iOS ${SDK_VER:-brak} z $CANDIDATE" >&2
  exit 1
fi
