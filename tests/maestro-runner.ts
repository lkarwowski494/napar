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
  scrollUntilVisible?: string;
  hideKeyboard?: boolean;
  back?: boolean;
  /** Polecenie spoza listy obsługiwanych — walidator je odrzuca. */
  unknown?: string;
}

export interface MaestroFlow {
  appId: string;
  name: string;
  commands: MaestroCommand[];
  rawPath: string;
}

const FLAG_COMMANDS = ['launchApp', 'back', 'hideKeyboard'] as const;
const TEXT_COMMANDS = ['assertVisible', 'assertNotVisible', 'tapOn', 'inputText', 'takeScreenshot', 'scrollUntilVisible'] as const;

const unquote = (v: string) => v.trim().replace(/^["']|["']$/g, '');

/**
 * Parser YAML Maestro bez zależności. M1-audytor-generalny-043 (07-jakosc-007): każde polecenie
 * najwyższego poziomu („- nazwa…”) daje jeden element listy — nieznane nie znikają po cichu,
 * a cel podany w bloku zagnieżdżonym (id:/text:, też element.id dla scrollUntilVisible) jest odczytywany.
 */
export function parseMaestroYaml(content: string, rawPath: string = ''): MaestroFlow {
  const lines = content.split('\n');
  let appId = 'pl.lukasz.napar';
  let name = rawPath;
  const commands: MaestroCommand[] = [];

  let inBody = false;
  let current: { key: string; inline: string; nested: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const { key, inline, nested } = current;
    if ((FLAG_COMMANDS as readonly string[]).includes(key)) {
      commands.push({ [key]: true } as MaestroCommand);
    } else if ((TEXT_COMMANDS as readonly string[]).includes(key)) {
      let value = unquote(inline);
      if (!value) {
        const target = nested.map((l) => l.match(/^(?:id|text):\s*(.+)$/)).find(Boolean);
        value = target ? unquote(target[1]) : '';
      }
      commands.push({ [key]: value } as MaestroCommand);
    } else {
      commands.push({ unknown: key });
    }
    current = null;
  };

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
      continue;
    }

    const top = rawLine.match(/^- ([A-Za-z]+)\s*(?::\s*(.*))?$/);
    if (top) {
      flush();
      current = { key: top[1], inline: top[2] ?? '', nested: [] };
    } else if (current) {
      current.nested.push(line);
    }
  }
  flush();

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
    if (step.unknown) {
      throw new Error(`[Maestro-Validator] Unknown command "${step.unknown}" in ${flow.rawPath}`);
    }
    const key = Object.keys(step)[0];
    if ((TEXT_COMMANDS as readonly string[]).includes(key)) {
      const value = (step as Record<string, unknown>)[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`[Maestro-Validator] Invalid ${key} target in ${flow.rawPath}`);
      }
    } else if (!(FLAG_COMMANDS as readonly string[]).includes(key)) {
      throw new Error(`[Maestro-Validator] Empty command in ${flow.rawPath}`);
    }
    commandCount++;
  }

  return {
    valid: true,
    commandCount,
  };
}
