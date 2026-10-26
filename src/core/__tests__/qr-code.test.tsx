// ============================================================================
// Apps4Brew Studio — Unit Tests: Offline Vector QR Code (QrCodeSvg)
// TASK-P12-11-WZR
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QrCodeSvg, generateQrMatrix } from '../qr-code';

describe('Offline Vector QR Code (QrCodeSvg & generateQrMatrix)', () => {
  test('generateQrMatrix tworzy poprawną macierz kwadratową modułów', () => {
    const res = generateQrMatrix('napar://r/test-recipe');
    expect(res.size).toBeGreaterThan(0);
    expect(res.modules.length).toBe(res.size);
    expect(res.modules[0].length).toBe(res.size);
    expect(typeof res.modules[0][0]).toBe('boolean');

    // Obsługa pustego tekstu
    const emptyRes = generateQrMatrix('');
    expect(emptyRes.size).toBeGreaterThan(0);
  });

  test('QrCodeSvg renderuje komponent wektorowy SVG z zadanymi właściwościami', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <QrCodeSvg
          value="napar://r/share-123"
          size={180}
          color="#222222"
          backgroundColor="#FAFAFA"
          testID="qr-code-svg-test"
        />
      );
    });

    const json = tree!.toJSON() as any;
    expect(json).toBeDefined();
    expect(json.props.testID).toBe('qr-code-svg-test');
    expect(json.props.style).toEqual(
      expect.arrayContaining([{ width: 180, height: 180 }])
    );
  });

  test('TASK-P12-11-WZR: bezpiecznie zabezpiecza safeSize przed NaN, 0 i wartościami ujemnymi', () => {
    let treeNaN: renderer.ReactTestRenderer;
    act(() => {
      treeNaN = renderer.create(
        <QrCodeSvg value="napar://test" size={NaN} testID="qr-nan" />
      );
    });
    const jsonNaN = treeNaN!.toJSON() as any;
    expect(jsonNaN.props.style).toEqual(
      expect.arrayContaining([{ width: 200, height: 200 }])
    );

    let treeNegative: renderer.ReactTestRenderer;
    act(() => {
      treeNegative = renderer.create(
        <QrCodeSvg value="napar://test" size={-50} testID="qr-neg" />
      );
    });
    const jsonNeg = treeNegative!.toJSON() as any;
    expect(jsonNeg.props.style).toEqual(
      expect.arrayContaining([{ width: 200, height: 200 }])
    );
  });
});
