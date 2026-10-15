// ============================================================================
// Napar (Steepwise) — Unit Tests: CaffeineCurveChart
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { CaffeineCurveChart } from '../caffeine-chart';
import { CaffeineLog } from '../database-schema';

describe('CaffeineCurveChart Component', () => {
  const mockLogs: CaffeineLog[] = [
    {
      id: 'log-1',
      beverageName: 'V60 Hoffmann',
      beverageType: 'coffee',
      consumedAt: new Date().toISOString(),
      doseGrams: 15,
      caffeineMg: 140,
    },
  ];

  test('Renderuje wykres SVG bez błędów', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineCurveChart
          logs={mockLogs}
          bedtimeHour={23}
          thresholdMg={25.0}
        />
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();

    const str = JSON.stringify(json);
    expect(str).toContain('Krzywa Stężenia Kofeiny');
    expect(str).toContain('Próg NREM (25 mg)');
    expect(str).toContain('Sen (23:00)');
  });

  test('Renderuje pusty wykres, gdy brak dawek dzisiaj', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineCurveChart
          logs={[]}
          bedtimeHour={22}
          thresholdMg={25.0}
        />
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);
    expect(str).toContain('Sen (22:00)');
  });
});
