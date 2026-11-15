/**
 * Maestro E2E Flows Schema & Syntax Validation
 * Standards: BR-TEST-037, DEC-09, NFR-TEST-001
 * Validates all .maestro/*.yaml flow syntax and definitions.
 */

import fs from 'fs';
import path from 'path';
import { loadMaestroFlows, parseMaestroYaml, validateMaestroFlowSyntax } from './maestro-runner';

/** Liczba poleceń najwyższego poziomu policzona z surowego pliku, niezależnie od parsera (07-jakosc-007). */
function topLevelCommandCount(rawPath: string): number {
  const body = fs.readFileSync(path.join(__dirname, '..', '.maestro', rawPath), 'utf8').split('---').slice(1).join('---');
  return body.split('\n').filter((l) => /^- \S/.test(l)).length;
}

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
    // M1-audytor-generalny-043 (07-jakosc-007): dawniej commandCount porównywano z flow.commands.length,
    // które walidator zawsze zwracał; teraz z liczbą poleceń w surowym pliku — parser nie może gubić kroków.
    const result = validateMaestroFlowSyntax(flow);
    expect(result.valid).toBe(true);
    expect(result.commandCount).toBe(topLevelCommandCount(flow.rawPath));
  });

  test('07-jakosc-007: walidator odrzuca nieznane polecenie i tapOn bez celu', () => {
    const unknown = parseMaestroYaml('appId: pl.lukasz.napar\n---\n- launchApp\n- tapOnn: "X"\n', 'zly-1.yaml');
    expect(() => validateMaestroFlowSyntax(unknown)).toThrow(/Unknown command "tapOnn"/);
    const noTarget = parseMaestroYaml('appId: pl.lukasz.napar\n---\n- tapOn:\n    optional: true\n', 'zly-2.yaml');
    expect(() => validateMaestroFlowSyntax(noTarget)).toThrow(/Invalid tapOn target/);
    const nested = parseMaestroYaml('appId: pl.lukasz.napar\n---\n- tapOn:\n    id: "save-bean-btn"\n- hideKeyboard\n', 'ok.yaml');
    expect(nested.commands).toEqual([{ tapOn: 'save-bean-btn' }, { hideKeyboard: true }]);
  });
});
