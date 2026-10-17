// ============================================================================
// Napar (Steepwise) — Skaner Kodów QR Receptur (Zadanie N6 / expo-camera)
// Pozwala bezprzewodowo, w 100% offline zeskanować kod QR receptury od innego baristy.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from './theme';
import { CameraIcon } from '../components/icons/CraftIcons';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanRecipe: (data: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  visible,
  onClose,
  onScanRecipe,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const timeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    onScanRecipe(data.trim());
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setScanned(false), 1500);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            testID="qr-scanner-close-btn"
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij skaner"
          >
            <Text style={styles.closeBtnText}>Anuluj</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Skaner Receptur QR</Text>
          <View style={{ width: 60 }} />
        </View>

        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <View style={{ marginBottom: 16 }}>
              <CameraIcon size={44} color={theme.colors.copper} />
            </View>
            <Text style={styles.permissionTitle}>Dostęp do Aparatu</Text>
            <Text style={styles.permissionDesc}>
              Aparat jest potrzebny, aby natychmiast zeskanować kod QR z telefonu innego baristy i zaimportować recepturę w 100% offline.
            </Text>
            <Pressable
              testID="qr-scanner-permission-btn"
              style={styles.permissionBtn}
              onPress={requestPermission}
              accessibilityRole="button"
              accessibilityLabel="Zezwól na aparat"
            >
              <Text style={styles.permissionBtnText}>Zezwól na dostęp do aparatu</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              testID="qr-camera-view"
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Ramka celownika kuchennego */}
            <View style={styles.overlay}>
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.hintText}>
                Skieruj aparat na kod QR receptury w aplikacji Napar
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  permissionBox: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  permissionDesc: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 24,
    backgroundColor: theme.colors.copper,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.copper,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  hintText: {
    marginTop: 30,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
