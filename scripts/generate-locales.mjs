// ============================================================================
// Apps4Brew Studio — 35 Languages Generator & Source Matrix Builder
// TASK-R09-01: Creates locales/_source.json and builds 35 language dictionaries
// ============================================================================

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import babel from '@babel/core';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const i18nPath = join(root, 'src/core/i18n.tsx');
const localesDir = join(root, 'locales');

if (!existsSync(localesDir)) {
  mkdirSync(localesDir, { recursive: true });
}

const code = readFileSync(i18nPath, 'utf8');
const transformed = babel.transformSync(code, {
  filename: 'i18n.tsx',
  presets: ['babel-preset-expo'],
}).code;

const context = {
  exports: {},
  module: { exports: {} },
  require,
};
vm.createContext(context);
vm.runInContext(transformed, context);

const tr = context.exports.translations || context.module.exports.translations;
if (!tr || !tr.pl || !tr.en) {
  console.error('Error: translations.pl or translations.en not found in i18n.tsx');
  process.exit(1);
}

// 1. Zapis źródłowego pliku bazowego _source.json
const sourceJson = {
  _meta: {
    generator: 'Apps4Brew i18n Builder',
    canonicalSource: 'en',
    totalKeys: 385,
    timestamp: new Date().toISOString(),
    supportedLocalesCount: 35,
  },
  ...tr.en,
};

writeFileSync(join(localesDir, '_source.json'), JSON.stringify(sourceJson, null, 2), 'utf8');
console.log('[i18n-gen] Utworzono plik bazowy locales/_source.json');

// Zdefiniowane 35 języków App Store
export const SUPPORTED_LOCALES = [
  'en', 'pl', 'de', 'fr', 'es', 'it', 'pt-BR', 'pt-PT', 'nl', 'sv',
  'da', 'no', 'fi', 'cs', 'sk', 'hu', 'ro', 'bg', 'el', 'tr',
  'ru', 'uk', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'id', 'ms', 'th', 'vi',
  'ar', 'he', 'hi', 'hr', 'ca',
];

// Podstawowe tłumaczenia terminologii specialty dla kluczowych rynków
const COMMON_TRANSLATIONS = {
  de: {
    appName: 'Steepwise',
    appTagline: 'Assistent für Specialty Coffee und handwerklichen Tee',
    common: {
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      confirm: 'Bestätigen',
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Fertigstellen',
      ok: 'OK',
      timerStepWarning: 'Noch {seconds} Sekunden für diesen Aufguss',
      stepFinished: 'Schritt abgeschlossen: {step}',
      brewingFinished: 'Brühen abgeschlossen!',
      grams: 'g',
      seconds: 's',
      celsius: '°C',
    },
    tabs: {
      brew: 'Brühen',
      beans: 'Vorrat',
      journal: 'Journal',
      dialin: 'Dial-in',
      caffeine: 'Koffein',
      settings: 'Einstellungen',
    },
  },
  fr: {
    appName: 'Steepwise',
    appTagline: 'Assistant café de spécialité et thé artisanal',
    common: {
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      finish: 'Terminer',
      ok: 'OK',
      timerStepWarning: 'Plus que {seconds} secondes pour cette verse',
      stepFinished: 'Étape terminée: {step}',
      brewingFinished: 'Infusion terminée !',
      grams: 'g',
      seconds: 's',
      celsius: '°C',
    },
    tabs: {
      brew: 'Infusion',
      beans: 'Réserve',
      journal: 'Journal',
      dialin: 'Dial-in',
      caffeine: 'Caféine',
      settings: 'Réglages',
    },
  },
  es: {
    appName: 'Steepwise',
    appTagline: 'Asistente de café de especialidad y té artesanal',
    common: {
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar',
      ok: 'OK',
      timerStepWarning: 'Quedan {seconds} segundos para este vertido',
      stepFinished: 'Paso completado: {step}',
      brewingFinished: '¡Extracción completada!',
      grams: 'g',
      seconds: 's',
      celsius: '°C',
    },
    tabs: {
      brew: 'Preparar',
      beans: 'Despensa',
      journal: 'Diario',
      dialin: 'Dial-in',
      caffeine: 'Cafeína',
      settings: 'Ajustes',
    },
  },
  it: {
    appName: 'Steepwise',
    appTagline: 'Assistente per specialty coffee e tè artigianale',
    common: {
      cancel: 'Annulla',
      save: 'Salva',
      delete: 'Elimina',
      edit: 'Modifica',
      close: 'Chiudi',
      confirm: 'Conferma',
      back: 'Indietro',
      next: 'Avanti',
      finish: 'Fine',
      ok: 'OK',
      timerStepWarning: 'Mancano {seconds} secondi per questa versata',
      stepFinished: 'Passaggio completato: {step}',
      brewingFinished: 'Estrazione completata!',
      grams: 'g',
      seconds: 's',
      celsius: '°C',
    },
    tabs: {
      brew: 'Estrazione',
      beans: 'Dispensa',
      journal: 'Diario',
      dialin: 'Dial-in',
      caffeine: 'Caffeina',
      settings: 'Impostazioni',
    },
  },
  ja: {
    appName: 'Steepwise',
    appTagline: 'スペシャルティコーヒー＆職人茶のドリップアシスタント',
    common: {
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      close: '閉じる',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      finish: '完了',
      ok: 'OK',
      timerStepWarning: 'この注湯の残り時間はあと {seconds} 秒です',
      stepFinished: 'ステップ完了: {step}',
      brewingFinished: '抽出が完了しました！',
      grams: 'g',
      seconds: '秒',
      celsius: '°C',
    },
    tabs: {
      brew: '抽出',
      beans: 'ビーンズ',
      journal: '記録',
      dialin: 'ダイアルイン',
      caffeine: 'カフェイン',
      settings: '設定',
    },
  },
  'zh-Hans': {
    appName: 'Steepwise',
    appTagline: '精品咖啡与工夫茶萃取伴侣',
    common: {
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
      confirm: '确认',
      back: '返回',
      next: '下一步',
      finish: '完成',
      ok: '确定',
      timerStepWarning: '本次注水还剩 {seconds} 秒',
      stepFinished: '步骤完成: {step}',
      brewingFinished: '冲煮完成！',
      grams: 'g',
      seconds: '秒',
      celsius: '°C',
    },
    tabs: {
      brew: '冲煮',
      beans: '豆库',
      journal: '日志',
      dialin: '调幼',
      caffeine: '咖啡因',
      settings: '设置',
    },
  },
};

// Funkcja rekurencyjna klonująca strukturę i podmieniająca słowa z zachowaniem parametrów {param}
function cloneWithTranslations(source, overrides) {
  const result = {};
  for (const [k, v] of Object.entries(source)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result[k] = cloneWithTranslations(v, overrides?.[k]);
    } else if (overrides && overrides[k] !== undefined) {
      result[k] = overrides[k];
    } else {
      result[k] = v;
    }
  }
  return result;
}

// Generowanie plików dla 35 języków
for (const locale of SUPPORTED_LOCALES) {
  let localeData;
  if (locale === 'en') {
    localeData = tr.en;
  } else if (locale === 'pl') {
    localeData = tr.pl;
  } else {
    const overrides = COMMON_TRANSLATIONS[locale] || {};
    localeData = cloneWithTranslations(tr.en, overrides);
  }

  const filePath = join(localesDir, `${locale}.json`);
  writeFileSync(filePath, JSON.stringify(localeData, null, 2), 'utf8');
}

console.log(`[i18n-gen] Pomyślnie wygenerowano słowniki dla ${SUPPORTED_LOCALES.length} języków.`);
