/**
 * Maestro E2E Flows Execution in Jest
 * Standards: BR-TEST-037, DEC-09, NFR-TEST-001
 * Runs all .maestro/*.yaml flows across Monday, Sunday, and 23:55 UTC.
 */

import { loadMaestroFlows, executeMaestroFlow } from './maestro-runner';

const CRITICAL_TIMEPOINTS = [
  { name: 'Monday Morning (10:00 UTC)', date: new Date('2026-10-12T10:00:00.000Z') },
  { name: 'Sunday Summary (10:00 UTC)', date: new Date('2026-10-18T10:00:00.000Z') },
  { name: 'Saturday Midnight Boundary (23:55 UTC)', date: new Date('2026-10-17T23:55:00.000Z') },
];

describe('BR-TEST-037: Maestro E2E Scenario In-Memory Execution', () => {
  const flows = loadMaestroFlows();

  test('All .maestro/*.yaml flows are discovered and parsed', () => {
    expect(flows.length).toBeGreaterThanOrEqual(7);
    for (const f of flows) {
      expect(f.appId).toBe('pl.lukasz.napar');
      expect(f.commands.length).toBeGreaterThan(0);
    }
  });

  describe.each(CRITICAL_TIMEPOINTS)('Timepoint: $name', ({ date }) => {
    test.each(flows)('Executes flow $rawPath: "$name"', (flow) => {
      const result = executeMaestroFlow(flow, date);
      expect(result.passed).toBe(true);
      expect(result.executedCount).toBe(flow.commands.length);
    });
  });
});
