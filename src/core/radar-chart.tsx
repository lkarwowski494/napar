// ============================================================================
// Napar (Steepwise) — Wykres Radarowy Sensoryki SVG (Spider Graph / Radar Chart)
// 5 osi SCA: Kwasowość, Słodycz, Ciało, Czystość, Finisz (skala 1–5)
// ============================================================================

import type { SupportedLanguage } from './i18n';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { theme } from './theme';
import { pickBilingual } from './i18n-loader';

export interface SensoryProfile {
  acidity: number; // 1 - 5
  sweetness: number; // 1 - 5
  body: number; // 1 - 5
  clarity: number; // 1 - 5
  finish: number; // 1 - 5
}

export const DEFAULT_SENSORY_PROFILE: SensoryProfile = {
  acidity: 3,
  sweetness: 3,
  body: 3,
  clarity: 3,
  finish: 3,
};

export interface AxisDefinition {
  key: keyof SensoryProfile;
  labelPl: string;
  labelEn: string;
}

export const SENSORY_AXES: AxisDefinition[] = [
  { key: 'acidity', labelPl: 'Kwasowość', labelEn: 'Acidity' },
  { key: 'sweetness', labelPl: 'Słodycz', labelEn: 'Sweetness' },
  { key: 'body', labelPl: 'Ciało', labelEn: 'Body' },
  { key: 'clarity', labelPl: 'Czystość', labelEn: 'Clarity' },
  { key: 'finish', labelPl: 'Finisz', labelEn: 'Finish' },
];

interface SensoryRadarChartProps {
  profile: SensoryProfile;
  size?: number;
  language?: SupportedLanguage;
  showLabels?: boolean;
}

export const SensoryRadarChart: React.FC<SensoryRadarChartProps> = ({
  profile,
  size = 220,
  language = 'pl',
  showLabels = true,
}) => {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.70; // Leave margin for labels
  const levels = [1, 2, 3, 4, 5];
  const numAxes = SENSORY_AXES.length;

  // Calculate coordinates for a given axis index and radius
  const getCoordinates = (index: number, radius: number) => {
    // Start at top (-PI/2) and rotate clockwise
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Concentric polygon points string for each level
  const getLevelPolygonPoints = (level: number) => {
    const r = (level / 5) * maxRadius;
    return SENSORY_AXES.map((_, i) => {
      const { x, y } = getCoordinates(i, r);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Data polygon points string
  const dataPoints = SENSORY_AXES.map((axis, i) => {
    const rawVal = profile[axis.key] ?? 1;
    const clampedVal = Math.min(5, Math.max(1, rawVal));
    const r = (clampedVal / 5) * maxRadius;
    return getCoordinates(i, r);
  });

  const dataPolygonPointsString = dataPoints
    .map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');

  return (
    <View style={[styles.chartContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} testID="sensory-radar-svg">
        {/* Concentric grid polygons */}
        {levels.map((level) => (
          <Polygon
            key={`level-${level}`}
            points={getLevelPolygonPoints(level)}
            fill={level === 5 ? 'rgba(255, 255, 255, 0.02)' : 'none'}
            stroke={theme.colors.border}
            strokeWidth={level === 5 ? '1.5' : '1'}
            strokeDasharray={level < 5 ? '2,2' : undefined}
          />
        ))}

        {/* Axis Spokes from center to level 5 */}
        {SENSORY_AXES.map((_, i) => {
          const { x, y } = getCoordinates(i, maxRadius);
          return (
            <Line
              key={`spoke-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={theme.colors.border}
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon Fill & Outline */}
        <Polygon
          points={dataPolygonPointsString}
          fill="rgba(217, 119, 54, 0.35)"
          stroke={theme.colors.copper}
          strokeWidth="2.5"
        />

        {/* Data Vertex Dots */}
        {dataPoints.map((pt, i) => (
          <Circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill={theme.colors.copper}
            stroke={theme.colors.bgCard}
            strokeWidth="1.5"
          />
        ))}

        {/* Labels at outer vertices */}
        {showLabels &&
          SENSORY_AXES.map((axis, i) => {
            const labelRadius = maxRadius + 16;
            const { x, y } = getCoordinates(i, labelRadius);
            const labelText = pickBilingual(language, axis.labelPl, axis.labelEn);

            // Anchor adjustment based on angle
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (i === 1 || i === 2) textAnchor = 'start';
            else if (i === 3 || i === 4) textAnchor = 'end';

            const dy = i === 0 ? -4 : i === 2 || i === 3 ? 10 : 4;

            return (
              <SvgText
                key={`label-${axis.key}`}
                x={x}
                y={y + dy}
                fill={theme.colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor={textAnchor}
              >
                {labelText}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
};

// ============================================================================
// Komponent do regulacji punktacji sensorycznej (5 osi ze stepperami 1-5)
// ============================================================================

interface SensoryScoreEditorProps {
  profile: SensoryProfile;
  onChange: (newProfile: SensoryProfile) => void;
  language?: SupportedLanguage;
}

export const SensoryScoreEditor: React.FC<SensoryScoreEditorProps> = ({
  profile,
  onChange,
  language = 'pl',
}) => {
  const updateAxis = (key: keyof SensoryProfile, delta: number) => {
    const current = profile[key] ?? 3;
    const next = Math.min(5, Math.max(1, current + delta));
    onChange({
      ...profile,
      [key]: next,
    });
  };

  return (
    <View style={styles.editorContainer}>
      {SENSORY_AXES.map((axis) => {
        const val = profile[axis.key] ?? 3;
        const name = pickBilingual(language, axis.labelPl, axis.labelEn);

        return (
          <View key={axis.key} style={styles.editorRow}>
            <Text style={styles.axisLabel}>{name}</Text>
            <View style={styles.stepperContainer}>
              <Pressable
                style={[styles.stepBtn, val <= 1 && styles.stepBtnDisabled]}
                onPress={() => updateAxis(axis.key, -1)}
                disabled={val <= 1}
                hitSlop={8}
                accessibilityLabel={`Zmniejsz ${name}`}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <View style={styles.valBadge}>
                <Text style={styles.valText}>{`${val} / 5`}</Text>
              </View>
              <Pressable
                style={[styles.stepBtn, val >= 5 && styles.stepBtnDisabled]}
                onPress={() => updateAxis(axis.key, 1)}
                disabled={val >= 5}
                hitSlop={8}
                accessibilityLabel={`Zwiększ ${name}`}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  editorContainer: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  axisLabel: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepBtnText: {
    fontSize: 16,
    color: theme.colors.copper,
    fontWeight: '700',
    lineHeight: 18,
  },
  valBadge: {
    minWidth: 42,
    alignItems: 'center',
  },
  valText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.copper,
    fontVariant: ['tabular-nums'],
  },
});
