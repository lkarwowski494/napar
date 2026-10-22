// ============================================================================
// Napar (Steepwise) — Karta degustacyjna poza ekranem (poz. 31 MVP)
// Karta jest renderowana poza widocznym obszarem; po pierwszym układzie
// zapisuje się do PNG i otwiera arkusz udostępniania. Błąd zgłasza się do
// rodzica (ten może wrócić do tekstowej notatki).
// ============================================================================

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrewSession } from '../../core/database-schema';
import { buildTastingCardModel } from '../../core/tasting-card';
import { UnitSystem } from '../../core/unit-converter';
import { shareTastingCardImage } from '../../platform/tasting-card-share';
import { TastingCardView } from './TastingCardView';

interface TastingCardExportProps {
  session: BrewSession;
  unitSystem: UnitSystem;
  dialogTitle: string;
  onFinished: () => void;
  onFailed: (session: BrewSession) => void;
}

export function TastingCardExport({
  session,
  unitSystem,
  dialogTitle,
  onFinished,
  onFailed,
}: TastingCardExportProps) {
  const cardRef = useRef<View>(null);
  const started = useRef(false);

  const handleLayout = useCallback(() => {
    if (started.current) return;
    started.current = true;
    shareTastingCardImage(cardRef, dialogTitle)
      .then(() => onFinished())
      .catch(() => onFailed(session));
  }, [dialogTitle, onFinished, onFailed, session]);

  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={styles.offscreen}
      testID="tasting-card-export"
    >
      <View ref={cardRef} collapsable={false} onLayout={handleLayout} testID="tasting-card-capture">
        <TastingCardView model={buildTastingCardModel(session)} unitSystem={unitSystem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
});
