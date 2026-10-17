import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { CheckIcon } from '../icons/CraftIcons';
import { SUPPORTED_GRINDERS } from '../../core/grinder-converter';

export interface GrinderSelectionCardProps {
  selectedGrinder: string;
  onSelectGrinder: (grinderId: string) => void;
  title: string;
}

export const GrinderSelectionCard: React.FC<GrinderSelectionCardProps> = ({
  selectedGrinder,
  onSelectGrinder,
  title,
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.cardGroup}>
        {SUPPORTED_GRINDERS.map((grinder, idx) => {
          const isSelected = selectedGrinder === grinder.id;
          return (
            <React.Fragment key={grinder.id}>
              {idx > 0 && <View style={styles.divider} />}
              <Pressable
                style={[
                  styles.actionRow,
                  isSelected && { backgroundColor: theme.colors.bgCardSecondary },
                ]}
                onPress={() => onSelectGrinder(grinder.id)}
                accessibilityRole="button"
                accessibilityLabel={`${grinder.name}, ${isSelected ? 'wybrany' : 'wybierz'}`}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.actionTitle,
                      isSelected && { color: theme.colors.copper, fontWeight: '700' },
                    ]}
                  >
                    {grinder.name}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {grinder.stepMicrons} µm/klik · Zakres: {grinder.minSetting}–{grinder.maxSetting}
                  </Text>
                </View>
                {isSelected ? (
                  <CheckIcon size={18} color={theme.colors.copper} />
                ) : (
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1.5,
                      borderColor: theme.colors.border,
                    }}
                  />
                )}
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
});
