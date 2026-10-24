/**
 * Maestro E2E Flows Schema & Syntax Validation
 * Standards: BR-TEST-037, DEC-09, NFR-TEST-001
 * Validates all .maestro/*.yaml flow syntax and definitions.
 */

import { loadMaestroFlows, validateMaestroFlowSyntax } from './maestro-runner';

describe('BR-TEST-037: Maestro E2E Scenario Schema & Syntax Validation', () => {
  const flows = loadMaestroFlows();

  test('All .maestro/*.yaml flows are discovered and parsed', () => {
    expect(flows.length).toBeGreaterThanOrEqual(7);
    for (const f of flows) {
      expect(f.appId).toBe('pl.lukasz.napar');
      expect(f.commands.length).toBeGreaterThan(0);
    }
  });

  test.each(flows)('Validates YAML syntax for flow $rawPath: "$name"', (flow) => {
    const result = validateMaestroFlowSyntax(flow);
    expect(result.valid).toBe(true);
    expect(result.commandCount).toBe(flow.commands.length);
  });
});
