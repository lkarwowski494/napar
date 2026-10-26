// ============================================================================
// Napar (Steepwise) — Komponent Wektorowego Kodu QR (Offline SVG QR Code)
// DEC-20: Czyste renderowanie SVG offline bez zewnętrznych serwisów sieciowych
// ============================================================================

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';

export interface QrCodeSvgProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  testID?: string;
}

/**
 * Zwraca dwuwymiarową macierz logiczną modułów QR kodu
 */
export function generateQrMatrix(
  value: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): { size: number; modules: boolean[][] } {
  const text = typeof value === 'string' && value.trim() ? value : 'napar://empty';
  const qr = QRCode.create(text, { errorCorrectionLevel });
  const size = qr.modules.size;
  const matrix: boolean[][] = [];

  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    matrix.push(row);
  }

  return { size, modules: matrix };
}

/**
 * Komponent wektorowy SVG renderujący ostry kod QR w dowolnej rozdzielczości
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  testID,
}) => {
  const safeSize = typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 200;

  const { pathData, moduleCount } = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'napar://empty', { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      let d = '';

      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.modules.get(row, col)) {
            d += `M${col},${row}h1v1h-1z `;
          }
        }
      }

      return { pathData: d, moduleCount: count };
    } catch {
      return { pathData: '', moduleCount: 21 };
    }
  }, [value]);

  if (!pathData) {
    return null;
  }

  return (
    <View style={[styles.container, { width: safeSize, height: safeSize }]} testID={testID}>
      <Svg
        width={safeSize}
        height={safeSize}
        viewBox={`0 0 ${moduleCount} ${moduleCount}`}
      >
        <Rect width={moduleCount} height={moduleCount} fill={backgroundColor} />
        <Path d={pathData} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
