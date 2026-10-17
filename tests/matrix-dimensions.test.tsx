// ============================================================================
// Napar (Steepwise) — Dimensions & AX5 Layout Resilience (NFR-A11Y-004)
// Validates UI components render without crash under 320pt width and AX5 font scaling
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { View, Dimensions } from 'react-native';
import { Btn, NumInput, Field, SearchField, Empty, Missing } from '../src/components/ui';

describe('Dimensions & AX5 Dynamic Type Scaling (NFR-A11Y-004)', () => {
  const originalGet = Dimensions.get;

  beforeAll(() => {
    // Mock viewport 320pt (iPhone SE / minimum iOS viewport)
    Dimensions.get = jest.fn((dim) => {
      if (dim === 'window' || dim === 'screen') {
        return { width: 320, height: 568, scale: 2, fontScale: 2.0 };
      }
      return originalGet(dim);
    });
  });

  afterAll(() => {
    Dimensions.get = originalGet;
  });

  test('Core UI components render within 320pt container under fontScale=2.0 without error', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <View style={{ width: 320 }}>
          <Btn title="Bardzo długi tytuł przycisku w trybie AX5" variant="primary" onPress={() => {}} />
          <NumInput value={125.5} onChangeNumber={() => {}} label="Ilość wody" unit="g" />
          <Field value="Etiopia Yirgacheffe Washed" onChangeText={() => {}} label="Nazwa ziarna" />
          <SearchField value="Geisha" onChangeText={() => {}} />
          <Empty title="Brak elementów w spiżarni" description="Opis stanu pustego w małym oknie" />
          <Missing title="Brak rekordu" onBack={() => {}} />
        </View>
      );
    });

    expect(tree!).toBeDefined();
    const json = tree!.toJSON();
    expect(json).not.toBeNull();
  });
});
