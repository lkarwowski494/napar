// ============================================================================
// Napar — React Error Boundary (M1-audytor-generalny-010)
// Przechwytuje nieoczekiwane błędy renderowania bez białego ekranu śmierci.
// ============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../core/theme';
import { translations, detectSystemLanguage, formatTemplate, type SupportedLanguage } from '../core/i18n';
import { SUPPORT_EMAIL } from '../core/app-identity';

export interface AppErrorBoundaryProps {
  children: React.ReactNode;
  language?: SupportedLanguage;
  onRetry?: () => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: React.ErrorInfo): void {
    // Brak telemetrii (NFR-SEC-014); stan błędu obsłużony lokalnie w render().
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const lang: SupportedLanguage = this.props.language ?? detectSystemLanguage();
    const common = translations[lang].common;
    const email = SUPPORT_EMAIL || 'support@apps4brew.com';

    return (
      <View testID="app-error-boundary" style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{common.errorBoundaryTitle}</Text>
          <Text style={styles.desc}>{common.errorBoundaryDesc}</Text>
          <Text style={styles.contact}>
            {formatTemplate(common.errorBoundaryContact, { email })}
          </Text>
          <Pressable
            testID="error-boundary-retry-btn"
            style={styles.retryBtn}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel={common.errorBoundaryRetry}
          >
            <Text style={styles.retryBtnText}>{common.errorBoundaryRetry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  contact: {
    fontSize: 14,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 8,
    minHeight: 44,
    minWidth: 44,
    backgroundColor: theme.colors.copper,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onAccent,
  },
});
