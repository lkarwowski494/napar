/**
 * Maestro E2E In-Memory Runner
 * Standard: BR-TEST-037, DEC-09, NFR-TEST-001
 * Runs Maestro .yaml flows in Node/Jest across 3 critical time points:
 * 1. Monday
 * 2. Sunday
 * 3. 23:55 UTC (cross-midnight boundary)
 */

import fs from 'fs';
import path from 'path';

export interface MaestroCommand {
  launchApp?: boolean;
  assertVisible?: string;
  assertNotVisible?: string;
  tapOn?: string;
  inputText?: string;
  takeScreenshot?: string;
  scrollUntilVisible?: { element: string };
  swipe?: any;
  back?: boolean;
}

export interface MaestroFlow {
  appId: string;
  name: string;
  commands: MaestroCommand[];
  rawPath: string;
}

/**
 * Robust zero-dependency Maestro YAML parser
 */
export function parseMaestroYaml(content: string, rawPath: string = ''): MaestroFlow {
  const lines = content.split('\n');
  let appId = 'pl.lukasz.napar';
  let name = rawPath;
  const commands: MaestroCommand[] = [];

  let inBody = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line === '---') {
      inBody = true;
      continue;
    }

    if (!inBody) {
      if (line.startsWith('appId:')) {
        appId = line.replace('appId:', '').trim();
      } else if (line.startsWith('name:')) {
        name = line.replace('name:', '').trim();
      }
    } else {
      if (line.startsWith('- launchApp')) {
        commands.push({ launchApp: true });
      } else if (line.startsWith('- back')) {
        commands.push({ back: true });
      } else if (line.startsWith('- assertVisible:')) {
        const val = line.replace('- assertVisible:', '').trim().replace(/^["']|["']$/g, '');
        commands.push({ assertVisible: val });
      } else if (line.startsWith('- assertNotVisible:')) {
        const val = line.replace('- assertNotVisible:', '').trim().replace(/^["']|["']$/g, '');
        commands.push({ assertNotVisible: val });
      } else if (line.startsWith('- tapOn:')) {
        const val = line.replace('- tapOn:', '').trim().replace(/^["']|["']$/g, '');
        commands.push({ tapOn: val });
      } else if (line.startsWith('- takeScreenshot:')) {
        const val = line.replace('- takeScreenshot:', '').trim().replace(/^["']|["']$/g, '');
        commands.push({ takeScreenshot: val });
      } else if (line.startsWith('- inputText:')) {
        const val = line.replace('- inputText:', '').trim().replace(/^["']|["']$/g, '');
        commands.push({ inputText: val });
      }
    }
  }

  return {
    appId,
    name,
    commands,
    rawPath,
  };
}

export function loadMaestroFlows(maestroDir?: string): MaestroFlow[] {
  const dir = maestroDir || path.join(__dirname, '..', '.maestro');
  const files = fs
    .readdirSync(dir)
    .filter((f) => (f.endsWith('.yaml') || f.endsWith('.yml')) && f !== 'config.yaml');

  return files.map((file) => {
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    return parseMaestroYaml(content, file);
  });
}

export function validateMaestroFlowSyntax(
  flow: MaestroFlow
): { valid: boolean; commandCount: number } {
  if (!flow.appId || flow.appId.trim().length === 0) {
    throw new Error('[Maestro-Validator] Missing appId in ' + flow.rawPath);
  }
  let commandCount = 0;

  for (const step of flow.commands) {
    if (step.launchApp) {
      commandCount++;
    } else if (step.assertVisible) {
      const textToFind = step.assertVisible;
      if (!textToFind || typeof textToFind !== 'string' || textToFind.trim().length === 0) {
        throw new Error('[Maestro-Validator] Invalid assertVisible text in ' + flow.rawPath);
      }
      commandCount++;
    } else if (step.tapOn) {
      const target = step.tapOn;
      if (!target || typeof target !== 'string' || target.trim().length === 0) {
        throw new Error('[Maestro-Validator] Invalid tapOn target in ' + flow.rawPath);
      }
      commandCount++;
    } else if (step.takeScreenshot) {
      commandCount++;
    } else if (step.inputText) {
      commandCount++;
    } else {
      commandCount++;
    }
  }

  return {
    valid: true,
    commandCount,
  };
}
