// ============================================================================
// Napar — Wykres Kinetyki Kofeiny (Caffeine Elimination Curve)
// Model jedno-kompartmentowy z zaznaczeniem pory snu (bez progu snu — M1-audytor-generalny-015, DEC-05 a)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { CaffeineLog } from './database-schema';
import { calculateRemainingCaffeineMg, DEFAULT_CAFFEINE_HALF_LIFE_H } from './domain-rules';
import { normalizeBedtimeHourNumber } from './unit-converter';
import { theme } from './theme';
import { useTranslation, formatTemplate } from './i18n';

interface CaffeineChartProps {
  logs: CaffeineLog[];
  bedtimeHour: number; // np. 23 (23:00) lub 25 (01:00)
  halfLifeHours?: number; // domyślnie DEFAULT_CAFFEINE_HALF_LIFE_H (4 h, EFSA)
}

export const CaffeineCurveChart: React.FC<CaffeineChartProps> = ({
  logs,
  bedtimeHour,
  halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_H,
}) => {
  const { t } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(280, screenWidth - 64);
  const chartHeight = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Przedział czasu: 24 godziny od 06:00 dzisiaj do 06:00 jutro (kalendarzowo, odpornie na DST)
  const startHour = 6;
  const totalHours = 24;

  const now = new Date();
  const baseY = now.getFullYear();
  const baseM = now.getMonth();
  const baseD = now.getDate();
  const chartStartDate = new Date(baseY, baseM, baseD, startHour, 0, 0, 0);
  const chartEndDate = new Date(baseY, baseM, baseD, startHour + totalHours, 0, 0, 0);
  const chartSpanMs = Math.max(1, chartEndDate.getTime() - chartStartDate.getTime());

  // Wylicz stężenie kofeiny w każdym punkcie czasowym (co 30 min = 49 punktów)
  const pointsCount = 49;
  const dataPoints: { hourOffset: number; mg: number }[] = [];
  let maxMg = 50; // minimalna skala osi Y

  for (let i = 0; i < pointsCount; i++) {
    const hourOffset = startHour + (i / (pointsCount - 1)) * totalHours;
    const wholeHour = Math.floor(hourOffset);
    const minutes = Math.round((hourOffset - wholeHour) * 60);
    const pointDate = new Date(baseY, baseM, baseD, wholeHour, minutes, 0, 0);

    let sumMg = 0;
    for (const log of logs) {
      const intakeMs = new Date(log.consumedAt).getTime();
      if (Number.isNaN(intakeMs)) continue;
      const hoursPassed = (pointDate.getTime() - intakeMs) / (3600 * 1000);
      if (hoursPassed >= 0) {
        sumMg += calculateRemainingCaffeineMg(log.caffeineMg, hoursPassed, halfLifeHours);
      }
    }

    if (sumMg > maxMg) {
      maxMg = sumMg;
    }

    dataPoints.push({ hourOffset, mg: sumMg });
  }

  // Zaokrąglij skalę Y w górę
  const yMax = Math.ceil(maxMg / 50) * 50 + 20;

  // Skalowanie współrzędnych
  const getX = (hourOffset: number) => {
    const fraction = (hourOffset - startHour) / totalHours;
    return paddingLeft + fraction * innerWidth;
  };

  const getY = (mg: number) => {
    const fraction = Math.min(1, Math.max(0, mg / yMax));
    return paddingTop + (1 - fraction) * innerHeight;
  };

  // Generowanie ścieżki SVG
  let pathD = '';
  let areaD = '';

  dataPoints.forEach((pt, index) => {
    const x = getX(pt.hourOffset);
    const y = getY(pt.mg);
    if (index === 0) {
      pathD = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      areaD = `M ${x.toFixed(1)} ${paddingTop + innerHeight} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      areaD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });

  const lastX = getX(startHour + totalHours);
  areaD += ` L ${lastX.toFixed(1)} ${paddingTop + innerHeight} Z`;

  // Położenie linii godziny snu (bedtime)
  let bedtimeOffset = bedtimeHour;
  if (bedtimeOffset < startHour) {
    bedtimeOffset += 24;
  }
  const bedtimeX = getX(bedtimeOffset);
  const bedtimeNearRightEdge = bedtimeX > paddingLeft + innerWidth - 48;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.chartTitle}>{t.caffeine.chartTitle}</Text>
        <Text style={styles.chartSub}>{formatTemplate(t.caffeine.chartHalfLifeModel, { hours: halfLifeHours.toFixed(1) })}</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="caffeineGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.copper} stopOpacity="0.35" />
            <Stop offset="1" stopColor={theme.colors.copper} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Pozioma linia bazowa (dół) */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + innerHeight}
          x2={paddingLeft + innerWidth}
          y2={paddingTop + innerHeight}
          stroke={theme.colors.border}
          strokeWidth="1"
        />

        {/* Pionowa linia pory snu */}
        {bedtimeX <= paddingLeft + innerWidth && (
          <>
            <Line
              x1={bedtimeX}
              y1={paddingTop}
              x2={bedtimeX}
              y2={paddingTop + innerHeight}
              stroke={theme.colors.statusStable}
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
            <SvgText
              x={bedtimeNearRightEdge ? bedtimeX - 6 : bedtimeX + 4}
              y={paddingTop + 10}
              fill={theme.colors.statusStable}
              fontSize="9"
              fontWeight="700"
              textAnchor={bedtimeNearRightEdge ? 'end' : 'start'}
            >
              {formatTemplate(t.caffeine.chartBedtimeMarker, { hour: normalizeBedtimeHourNumber(bedtimeHour) })}
            </SvgText>
          </>
        )}

        {/* Obszar wypełnienia pod krzywą */}
        <Path d={areaD} fill="url(#caffeineGradient)" />

        {/* Główna linia krzywej kofeiny */}
        <Path
          d={pathD}
          fill="none"
          stroke={theme.colors.copper}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kropki spożytych dawek (wyłącznie mieszczących się w oknie osi 06:00–06:00) */}
        {logs.map((log) => {
          const logMs = new Date(log.consumedAt).getTime();
          if (Number.isNaN(logMs)) return null;
          if (logMs >= chartStartDate.getTime() && logMs <= chartEndDate.getTime()) {
            const fraction = (logMs - chartStartDate.getTime()) / chartSpanMs;
            const x = paddingLeft + fraction * innerWidth;
            return (
              <Circle
                key={log.id}
                cx={x}
                cy={paddingTop + innerHeight - 4}
                r="4.5"
                fill={theme.colors.copperLight}
                stroke={theme.colors.bgCard}
                strokeWidth="1.5"
              />
            );
          }
          return null;
        })}

        {/* Etykiety osi X (godziny) */}
        {[6, 10, 14, 18, 22, 2].map((h) => {
          let offset = h;
          if (offset < startHour) offset += 24;
          const x = getX(offset);
          return (
            <SvgText
              key={h}
              x={x - 8}
              y={chartHeight - 6}
              fill={theme.colors.textMuted}
              fontSize="9"
            >
              {`${h}:00`}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chartSub: {
    fontSize: 11,
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
});
