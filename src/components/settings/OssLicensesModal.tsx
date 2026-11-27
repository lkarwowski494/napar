import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import { ModalHeader } from '../ui';

export interface OssPackageEntry {
  name: string;
  license: string;
  holder: string;
}

export const BUNDLED_OSS_LICENSES: OssPackageEntry[] = [
  { name: 'react', license: 'MIT', holder: 'Meta Platforms, Inc.' },
  { name: 'react-native', license: 'MIT', holder: 'Meta Platforms, Inc.' },
  { name: 'expo', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-asset', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-audio', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-camera', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-constants', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-crypto', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-file-system', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-haptics', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-keep-awake', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-linking', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-localization', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-router', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-sharing', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'expo-sqlite', license: 'MIT', holder: '650 Industries, Inc.' },
  { name: 'qrcode', license: 'MIT', holder: 'Ryan Day & contributors' },
  { name: 'react-native-safe-area-context', license: 'MIT', holder: 'Th3rd Wave' },
  { name: 'react-native-screens', license: 'MIT', holder: 'Software Mansion' },
  { name: 'react-native-svg', license: 'MIT', holder: 'Software Mansion & contributors' },
];

export interface OssLicensesModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenWebLink?: () => void;
}

export const MIT_LICENSE_NOTICE = {
  title: 'MIT License',
  text: 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the inclusion of the copyright and permission notice. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.',
} as const;

export const OssLicensesModal: React.FC<OssLicensesModalProps> = ({
  visible,
  onClose,
  onOpenWebLink,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <ModalHeader
          onClose={onClose}
          closeLabel={t.common.close}
          style={styles.modalHeader}
        >
          <Text style={styles.modalTitle}>{t.settings.ossLicensesTitle}</Text>
        </ModalHeader>

        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
          <Text style={styles.modalSub}>{t.settings.ossLicensesDesc}</Text>

          {BUNDLED_OSS_LICENSES.map((pkg) => (
            <View key={pkg.name} style={styles.pkgRow}>
              <View style={styles.pkgInfo}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                <Text style={styles.pkgHolder}>{pkg.holder}</Text>
              </View>
              <Text style={styles.pkgLicense}>{pkg.license}</Text>
            </View>
          ))}

          <View style={styles.licenseNoticeBox} testID="oss-mit-notice">
            <Text style={styles.licenseNoticeTitle}>{MIT_LICENSE_NOTICE.title}</Text>
            <Text style={styles.licenseNoticeText}>{MIT_LICENSE_NOTICE.text}</Text>
          </View>

          {onOpenWebLink && (
            <Pressable
              testID="oss-licenses-web-link"
              style={styles.webLinkBtn}
              onPress={onOpenWebLink}
              accessibilityRole="link"
              accessibilityLabel={t.settings.ossLicensesWebLink}
            >
              <Text style={styles.webLinkBtnText}>{t.settings.ossLicensesWebLink} ↗</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  modalSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  pkgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  pkgInfo: {
    flex: 1,
    marginRight: 8,
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pkgHolder: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pkgLicense: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
  licenseNoticeBox: {
    marginTop: 8,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
  },
  licenseNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  licenseNoticeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  webLinkBtn: {
    minHeight: 44,
    marginTop: 12,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  webLinkBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
});
