// ============================================================================
// Napar (Steepwise) — Karta degustacyjna: widok do zapisu jako PNG (poz. 31 MVP)
// Sam układ karty. Renderowany poza ekranem przez TastingCardExport; model
// z src/core/tasting-card.ts. Kolory z tokenów motywu, kontrast jak w aplikacji.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import {
  formatDoseWeight,
  formatTemperature,
  formatWaterWeight,
  UnitSystem,
} from '../../core/unit-converter';
import {
  TastingCardModel,
  formatTastingDuration,
  formatTastingRating,
  formatTastingYield,
} from '../../core/tasting-card';

export const TASTING_CARD_WIDTH = 360;

interface TastingCardViewProps {
  model: TastingCardModel;
  unitSystem: UnitSystem;
}

export function TastingCardView({ model, unitSystem }: TastingCardViewProps) {
  const { t, language } = useTranslation();
  const texts = t.tastingCard;
  const date = new Date(model.brewedAtIso);
  const dateLabel = `${date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')} · ${date.toLocaleTimeString(
    language === 'pl' ? 'pl-PL' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  )}`;

  return (
    <View style={styles.card} testID="tasting-card-view">
      <Text style={styles.brand}>{texts.brand}</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.meta}>
        {model.method} · {dateLabel}
      </Text>

      <View style={styles.paramRow}>
        <Param label={texts.dose} value={formatDoseWeight(model.doseGrams, unitSystem)} />
        <Param label={texts.water} value={formatWaterWeight(model.waterGrams, unitSystem)} />
        <Param label={texts.temperature} value={formatTemperature(model.waterTempCelsius, unitSystem)} />
        <Param label={texts.time} value={formatTastingDuration(model.totalTimeSeconds)} />
      </View>

      {model.rating !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>{texts.rating}</Text>
          <Text style={styles.rating}>{formatTastingRating(model.rating)} / 5</Text>
        </View>
      )}

      {model.balance !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>{texts.balance}</Text>
          <Text style={styles.value}>{texts.balanceLabel[model.balance]}</Text>
        </View>
      )}

      {model.extractionYieldPercent !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>{texts.yield}</Text>
          <Text style={styles.value}>{formatTastingYield(model.extractionYieldPercent)}%</Text>
        </View>
      )}

      {model.inventoryName !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>{texts.inventory}</Text>
          <Text style={styles.value}>{model.inventoryName}</Text>
        </View>
      )}

      {model.flavorTags.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.label}>{texts.flavorNotes}</Text>
          <Text style={styles.value}>{model.flavorTags.join(' · ')}</Text>
        </View>
      )}

      {model.notes !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>{texts.notes}</Text>
          <Text style={styles.notes}>{model.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>{texts.footer}</Text>
    </View>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.param}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.paramValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: TASTING_CARD_WIDTH,
    backgroundColor: theme.colors.bgCard,
    padding: 24,
    borderRadius: 16,
  },
  brand: {
    color: theme.colors.copperLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    marginBottom: 12,
  },
  param: {
    flex: 1,
    alignItems: 'center',
  },
  paramValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  block: {
    marginTop: 10,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    marginTop: 2,
  },
  rating: {
    color: theme.colors.emeraldLight,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  notes: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 18,
    textAlign: 'center',
  },
});
