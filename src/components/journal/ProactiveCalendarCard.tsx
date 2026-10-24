// ============================================================================
// Napar (Steepwise) — ProactiveCalendarCard (14-Day Calendar & 1-Tap Action Feed)
// Przekształcenie pasywnych list w Proaktywny Kalendarz i Harmonogram Akcji
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { theme } from '../../core/theme';
import {
  CalendarDayItem,
  ProactiveActionItem,
  buildFourteenDayCalendar,
  buildProactiveActionSchedule,
  generateActionIcsContent,
} from '../../core/bpr-engine';
import { InventoryItem, BrewSession } from '../../core/database-schema';

export interface ProactiveCalendarCardProps {
  inventory: InventoryItem[];
  sessions: BrewSession[];
  language?: 'pl' | 'en';
  referenceDateIso?: string;
  onExecuteAction: (action: ProactiveActionItem) => void;
}

export function ProactiveCalendarCard({
  inventory,
  sessions,
  language = 'pl',
  referenceDateIso,
  onExecuteAction,
}: ProactiveCalendarCardProps) {
  const isEn = language === 'en';
  const refIso = useMemo(
    () => referenceDateIso || new Date().toISOString(),
    [referenceDateIso]
  );

  const [scheduleFilter, setScheduleFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  const calendarDays: CalendarDayItem[] = useMemo(
    () => buildFourteenDayCalendar(refIso, inventory, sessions),
    [refIso, inventory, sessions]
  );

  const allActions: ProactiveActionItem[] = useMemo(
    () => buildProactiveActionSchedule(refIso, inventory, sessions),
    [refIso, inventory, sessions]
  );

  const displayedActions = useMemo(() => {
    if (selectedDateIso) {
      const forDay = allActions.filter((a) => a.dateIso === selectedDateIso);
      if (forDay.length > 0) return forDay;
    }
    if (scheduleFilter === 'upcoming') {
      return allActions.filter((a) => a.daysOffset <= 3).slice(0, 4);
    }
    return allActions;
  }, [allActions, scheduleFilter, selectedDateIso]);

  const handleExportIcs = async (action: ProactiveActionItem) => {
    try {
      const ics = generateActionIcsContent(action, isEn ? 'en' : 'pl');
      const title = isEn ? action.titleEn || action.titlePl : action.titlePl;
      await Share.share({
        title: `${title}.ics`,
        message: ics,
      });
    } catch {
      // fallback
    }
  };

  return (
    <View style={styles.container} testID="proactive-calendar-card">
      {/* Nagłówek 14-dniowego Kalendarza */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>
            {isEn ? '14-DAY FRESHNESS & BREW CALENDAR' : 'KALENDARZ 14-DNIOWY I HARMONOGRAM'}
          </Text>
          <Text style={styles.title}>
            {isEn ? 'Proactive Action Schedule' : 'Proaktywny Harmonogram Akcji'}
          </Text>
        </View>
        {selectedDateIso && (
          <Pressable
            testID="calendar-clear-date-btn"
            style={styles.clearDateChip}
            onPress={() => setSelectedDateIso(null)}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Show all days' : 'Pokaż wszystkie dni'}
          >
            <Text style={styles.clearDateText}>
              {isEn ? 'All days' : 'Wszystkie dni'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Pasek 14 dni z kolorowymi kropkami */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScroll}
      >
        {calendarDays.map((day) => {
          const isSelected = selectedDateIso === day.dateIso;
          return (
            <Pressable
              key={day.dateIso}
              testID={`calendar-day-${day.dateIso}`}
              style={[
                styles.dayCell,
                day.isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() =>
                setSelectedDateIso(isSelected ? null : day.dateIso)
              }
              accessibilityRole="button"
              accessibilityLabel={`${day.weekdayPl} ${day.dayNumber}`}
            >
              <Text
                style={[
                  styles.dayWeekday,
                  (day.isToday || isSelected) && styles.dayTextActive,
                ]}
              >
                {isEn ? day.weekdayEn : day.weekdayPl}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  (day.isToday || isSelected) && styles.dayTextActive,
                ]}
              >
                {day.dayNumber}
              </Text>
              <View style={styles.dotsRow}>
                {(day.dotType === 'action' || day.dotType === 'both') && (
                  <View style={[styles.dot, styles.dotAction]} />
                )}
                {(day.dotType === 'session' || day.dotType === 'both') && (
                  <View style={[styles.dot, styles.dotSession]} />
                )}
                {day.dotType === 'none' && <View style={styles.dotPlaceholder} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Przełącznik Harmonogramu Akcji: [Najbliższe] / [Wszystkie] */}
      <View style={styles.scheduleHeaderRow}>
        <Text style={styles.scheduleSectionTitle}>
          {isEn ? '1-TAP ACTION FEED' : 'HARMONOGRAM AKCJI (1-TAP)'}
        </Text>
        <View style={styles.modeSwitchRow}>
          <Pressable
            testID="schedule-filter-upcoming"
            style={[
              styles.modeBtn,
              scheduleFilter === 'upcoming' && styles.modeBtnActive,
            ]}
            onPress={() => {
              setSelectedDateIso(null);
              setScheduleFilter('upcoming');
            }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Upcoming actions' : 'Najbliższe akcje'}
          >
            <Text
              style={[
                styles.modeBtnText,
                scheduleFilter === 'upcoming' && styles.modeBtnTextActive,
              ]}
            >
              {isEn ? 'Upcoming' : 'Najbliższe'}
            </Text>
          </Pressable>
          <Pressable
            testID="schedule-filter-all"
            style={[
              styles.modeBtn,
              scheduleFilter === 'all' && styles.modeBtnActive,
            ]}
            onPress={() => {
              setSelectedDateIso(null);
              setScheduleFilter('all');
            }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'All scheduled actions' : 'Wszystkie akcje'}
          >
            <Text
              style={[
                styles.modeBtnText,
                scheduleFilter === 'all' && styles.modeBtnTextActive,
              ]}
            >
              {isEn ? 'All' : 'Wszystkie'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Lista chronologiczna akcji (DZIŚ / JUTRO / Za X dni) */}
      <View style={styles.actionsList}>
        {displayedActions.map((act) => (
          <View
            key={act.id}
            style={styles.actionRowCard}
            testID={`proactive-action-${act.id}`}
          >
            <View style={styles.actionTopRow}>
              <View
                style={[
                  styles.bucketBadge,
                  act.daysOffset === 0 && styles.bucketBadgeToday,
                ]}
              >
                <Text
                  style={[
                    styles.bucketBadgeText,
                    act.daysOffset === 0 && styles.bucketBadgeTextToday,
                  ]}
                >
                  {isEn ? act.bucketLabelEn : act.bucketLabelPl}
                </Text>
              </View>
              <Text style={styles.actionDateLabel}>{act.dateIso}</Text>
            </View>

            <Text style={styles.actionTitle}>
              {isEn ? act.titleEn : act.titlePl}
            </Text>
            <Text style={styles.actionSubtitle}>
              {isEn ? act.subtitleEn : act.subtitlePl}
            </Text>

            <View style={styles.actionButtonsRow}>
              <Pressable
                testID={`execute-action-btn-${act.id}`}
                style={styles.executeOneTapBtn}
                onPress={() => onExecuteAction(act)}
                accessibilityRole="button"
                accessibilityLabel={
                  isEn
                    ? `1-Tap Execute: ${act.titleEn}`
                    : `Wykonaj 1-Tap: ${act.titlePl}`
                }
              >
                <Text style={styles.executeOneTapText}>
                  {isEn ? '▶ 1-Tap Brew Now' : '▶ Wykonaj 1-Tap'}
                </Text>
              </Pressable>

              <Pressable
                testID={`ics-export-btn-${act.id}`}
                style={styles.icsExportBtn}
                onPress={() => handleExportIcs(act)}
                accessibilityRole="button"
                accessibilityLabel={
                  isEn ? 'Export .ics reminder' : 'Eksportuj przypomnienie .ics'
                }
              >
                <Text style={styles.icsExportBtnText}>.ics</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  clearDateChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearDateText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  daysScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  dayCell: {
    width: 44,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  dayCellSelected: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copper,
  },
  dayWeekday: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginVertical: 2,
  },
  dayTextActive: {
    color: theme.colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotAction: {
    backgroundColor: theme.colors.emerald,
  },
  dotSession: {
    backgroundColor: theme.colors.copper,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    marginBottom: 8,
  },
  scheduleSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeBtnActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  modeBtnTextActive: {
    color: theme.colors.copper,
    fontWeight: '800',
  },
  actionsList: {
    gap: 8,
  },
  actionRowCard: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 11,
  },
  actionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bucketBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bucketBadgeToday: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  bucketBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.textSecondary,
  },
  bucketBadgeTextToday: {
    color: theme.colors.copper,
  },
  actionDateLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  executeOneTapBtn: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeOneTapText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  icsExportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icsExportBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
  },
});
