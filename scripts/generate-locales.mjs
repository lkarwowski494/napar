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
    totalKeys: Object.keys(tr.en).length,
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

// Podstawowe tłumaczenia terminologii specialty dla wszystkich rynków (D-026, DEC-04)
export const COMMON_TRANSLATIONS = {
  de: {
    appName: 'Steepwise',
    appTagline: 'Assistent für Specialty Coffee und handwerklichen Tee',
    common: {
      cancel: 'Abbrechen', save: 'Speichern', delete: 'Löschen', edit: 'Bearbeiten',
      close: 'Schließen', confirm: 'Bestätigen', back: 'Zurück', next: 'Weiter',
      finish: 'Fertigstellen', ok: 'OK', timerStepWarning: 'Noch {seconds} Sekunden für diesen Aufguss',
      stepFinished: 'Schritt abgeschlossen: {step}', brewingFinished: 'Brühen abgeschlossen!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Brühen', beans: 'Vorrat', journal: 'Journal', dialin: 'Dial-in', caffeine: 'Koffein', settings: 'Einstellungen' },
  },
  fr: {
    appName: 'Steepwise',
    appTagline: 'Assistant café de spécialité et thé artisanal',
    common: {
      cancel: 'Annuler', save: 'Enregistrer', delete: 'Supprimer', edit: 'Modifier',
      close: 'Fermer', confirm: 'Confirmer', back: 'Retour', next: 'Suivant',
      finish: 'Terminer', ok: 'OK', timerStepWarning: 'Plus que {seconds} secondes pour cette verse',
      stepFinished: 'Étape terminée: {step}', brewingFinished: 'Infusion terminée !',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Infusion', beans: 'Réserve', journal: 'Journal', dialin: 'Dial-in', caffeine: 'Caféine', settings: 'Réglages' },
  },
  es: {
    appName: 'Steepwise',
    appTagline: 'Asistente de café de especialidad y té artesanal',
    common: {
      cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar', edit: 'Editar',
      close: 'Cerrar', confirm: 'Confirmar', back: 'Atrás', next: 'Siguiente',
      finish: 'Finalizar', ok: 'OK', timerStepWarning: 'Quedan {seconds} segundos para este vertido',
      stepFinished: 'Paso completado: {step}', brewingFinished: '¡Extracción completada!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Preparar', beans: 'Despensa', journal: 'Diario', dialin: 'Dial-in', caffeine: 'Cafeína', settings: 'Ajustes' },
  },
  it: {
    appName: 'Steepwise',
    appTagline: 'Assistente per specialty coffee e tè artigianale',
    common: {
      cancel: 'Annulla', save: 'Salva', delete: 'Elimina', edit: 'Modifica',
      close: 'Chiudi', confirm: 'Conferma', back: 'Indietro', next: 'Avanti',
      finish: 'Fine', ok: 'OK', timerStepWarning: 'Mancano {seconds} secondi per questa versata',
      stepFinished: 'Passaggio completato: {step}', brewingFinished: 'Estrazione completata!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Estrazione', beans: 'Dispensa', journal: 'Diario', dialin: 'Dial-in', caffeine: 'Caffeina', settings: 'Impostazioni' },
  },
  'pt-BR': {
    appName: 'Steepwise',
    appTagline: 'Assistente para cafés especiais e chás artesanais',
    common: {
      cancel: 'Cancelar', save: 'Salvar', delete: 'Excluir', edit: 'Editar',
      close: 'Fechar', confirm: 'Confirmar', back: 'Voltar', next: 'Avançar',
      finish: 'Concluir', ok: 'OK', timerStepWarning: 'Restam {seconds} segundos para este despejo',
      stepFinished: 'Etapa concluída: {step}', brewingFinished: 'Preparo concluído!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Preparo', beans: 'Despensa', journal: 'Diário', dialin: 'Dial-in', caffeine: 'Cafeína', settings: 'Ajustes' },
  },
  'pt-PT': {
    appName: 'Steepwise',
    appTagline: 'Assistente para café de especialidade e chá artesanal',
    common: {
      cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar', edit: 'Editar',
      close: 'Fechar', confirm: 'Confirmar', back: 'Retroceder', next: 'Seguinte',
      finish: 'Terminar', ok: 'OK', timerStepWarning: 'Restam {seconds} segundos para esta infusão',
      stepFinished: 'Passo concluído: {step}', brewingFinished: 'Infusão concluída!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Infusão', beans: 'Despensa', journal: 'Diário', dialin: 'Dial-in', caffeine: 'Cafeína', settings: 'Definições' },
  },
  nl: {
    appName: 'Steepwise',
    appTagline: 'Assistent voor specialty coffee en ambachtelijke thee',
    common: {
      cancel: 'Annuleren', save: 'Opslaan', delete: 'Verwijderen', edit: 'Bewerken',
      close: 'Sluiten', confirm: 'Bevestigen', back: 'Terug', next: 'Volgende',
      finish: 'Voltooien', ok: 'OK', timerStepWarning: 'Nog {seconds} seconden voor deze opgieting',
      stepFinished: 'Stap voltooid: {step}', brewingFinished: 'Zetten voltooid!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Zetten', beans: 'Voorraad', journal: 'Logboek', dialin: 'Dial-in', caffeine: 'Cafeïne', settings: 'Instellingen' },
  },
  sv: {
    appName: 'Steepwise',
    appTagline: 'Assistent för specialkaffe och hantverkste',
    common: {
      cancel: 'Avbryt', save: 'Spara', delete: 'Ta bort', edit: 'Redigera',
      close: 'Stäng', confirm: 'Bekräfta', back: 'Tillbaka', next: 'Nästa',
      finish: 'Slutför', ok: 'OK', timerStepWarning: '{seconds} sekunder kvar av denna hällning',
      stepFinished: 'Steg klart: {step}', brewingFinished: 'Bryggning klar!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Brygg', beans: 'Skafferi', journal: 'Dagbok', dialin: 'Dial-in', caffeine: 'Koffein', settings: 'Inställningar' },
  },
  da: {
    appName: 'Steepwise',
    appTagline: 'Assistent til specialkaffe og håndbrygget te',
    common: {
      cancel: 'Annuller', save: 'Gem', delete: 'Slet', edit: 'Rediger',
      close: 'Luk', confirm: 'Bekræft', back: 'Tilbage', next: 'Næste',
      finish: 'Afslut', ok: 'OK', timerStepWarning: '{seconds} sekunder tilbage af denne hældning',
      stepFinished: 'Trin fuldført: {step}', brewingFinished: 'Brygning afsluttet!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Bryg', beans: 'Kaffebønner', journal: 'Dagbog', dialin: 'Dial-in', caffeine: 'Koffein', settings: 'Indstillinger' },
  },
  no: {
    appName: 'Steepwise',
    appTagline: 'Assistent for spesialkaffe og håndbrygget te',
    common: {
      cancel: 'Avbryt', save: 'Lagre', delete: 'Slett', edit: 'Rediger',
      close: 'Lukk', confirm: 'Bekreft', back: 'Tilbake', next: 'Neste',
      finish: 'Fullfør', ok: 'OK', timerStepWarning: '{seconds} sekunder gjenstår av denne hellingen',
      stepFinished: 'Steg fullført: {step}', brewingFinished: 'Brygging fullført!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Brygg', beans: 'Kaffebønner', journal: 'Journal', dialin: 'Dial-in', caffeine: 'Koffein', settings: 'Innstillinger' },
  },
  fi: {
    appName: 'Steepwise',
    appTagline: 'Erikoiskahvin ja artesaaniteen uuttoavustaja',
    common: {
      cancel: 'Peruuta', save: 'Tallenna', delete: 'Poista', edit: 'Muokkaa',
      close: 'Sulje', confirm: 'Vahvista', back: 'Takaisin', next: 'Seuraava',
      finish: 'Valmis', ok: 'OK', timerStepWarning: '{seconds} sekuntia jäljellä tätä kaatoa',
      stepFinished: 'Vaihe valmis: {step}', brewingFinished: 'Uutto valmis!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Uutto', beans: 'Pavut', journal: 'Päiväkirja', dialin: 'Dial-in', caffeine: 'Kofeiini', settings: 'Asetukset' },
  },
  cs: {
    appName: 'Steepwise',
    appTagline: 'Průvodce výběrovou kávou a řemeslným čajem',
    common: {
      cancel: 'Zrušit', save: 'Uložit', delete: 'Smazat', edit: 'Upravit',
      close: 'Zavřít', confirm: 'Potvrdit', back: 'Zpět', next: 'Další',
      finish: 'Dokončit', ok: 'OK', timerStepWarning: 'Zbývá {seconds} sekund pro toto zalití',
      stepFinished: 'Krok dokončen: {step}', brewingFinished: 'Příprava dokončena!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Příprava', beans: 'Spíž', journal: 'Deník', dialin: 'Dial-in', caffeine: 'Kofein', settings: 'Nastavení' },
  },
  sk: {
    appName: 'Steepwise',
    appTagline: 'Sprievodca výberovou kávou a remeselným čajom',
    common: {
      cancel: 'Zrušiť', save: 'Uložiť', delete: 'Vymazať', edit: 'Upraviť',
      close: 'Zavrieť', confirm: 'Potvrdiť', back: 'Späť', next: 'Ďalej',
      finish: 'Dokončiť', ok: 'OK', timerStepWarning: 'Zostáva {seconds} sekúnd do konca tohto zaliatia',
      stepFinished: 'Krok dokončený: {step}', brewingFinished: 'Príprava dokončená!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Príprava', beans: 'Špajza', journal: 'Denník', dialin: 'Dial-in', caffeine: 'Kofeín', settings: 'Nastavenia' },
  },
  hu: {
    appName: 'Steepwise',
    appTagline: 'Útmutató újhullámos kávéhoz és szálas teához',
    common: {
      cancel: 'Mégse', save: 'Mentés', delete: 'Törlés', edit: 'Szerkesztés',
      close: 'Bezárás', confirm: 'Megerősítés', back: 'Vissza', next: 'Következő',
      finish: 'Befejezés', ok: 'OK', timerStepWarning: 'Még {seconds} másodperc van hátra ebből a felöntésből',
      stepFinished: 'Lépés kész: {step}', brewingFinished: 'Főzés befejezve!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Készítés', beans: 'Kamra', journal: 'Napló', dialin: 'Dial-in', caffeine: 'Koffein', settings: 'Beállítások' },
  },
  ro: {
    appName: 'Steepwise',
    appTagline: 'Asistent pentru cafea de specialitate și ceai artizanal',
    common: {
      cancel: 'Anulează', save: 'Salvează', delete: 'Șterge', edit: 'Editează',
      close: 'Închide', confirm: 'Confirmă', back: 'Înapoi', next: 'Următorul',
      finish: 'Finalizează', ok: 'OK', timerStepWarning: 'Mai sunt {seconds} secunde pentru această turnare',
      stepFinished: 'Pas finalizat: {step}', brewingFinished: 'Preparare finalizată!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Preparare', beans: 'Cămară', journal: 'Jurnal', dialin: 'Dial-in', caffeine: 'Cofeină', settings: 'Setări' },
  },
  bg: {
    appName: 'Steepwise',
    appTagline: 'Асистент за специално кафе и занаятчийски чай',
    common: {
      cancel: 'Отказ', save: 'Запази', delete: 'Изтрий', edit: 'Редактирай',
      close: 'Затвори', confirm: 'Потвърди', back: 'Назад', next: 'Напред',
      finish: 'Край', ok: 'OK', timerStepWarning: 'Остават {seconds} секунди за това заливане',
      stepFinished: 'Стъпка завършена: {step}', brewingFinished: 'Приготвянето завърши!',
      grams: 'г', seconds: 'сек', celsius: '°C',
    },
    tabs: { brew: 'Приготвяне', beans: 'Зърна', journal: 'Дневник', dialin: 'Dial-in', caffeine: 'Кофеин', settings: 'Настройки' },
  },
  el: {
    appName: 'Steepwise',
    appTagline: 'Βοηθός specialty καφέ και χειροποίητου τσαγιού',
    common: {
      cancel: 'Άκυρο', save: 'Αποθήκευση', delete: 'Διαγραφή', edit: 'Επεξεργασία',
      close: 'Κλείσιμο', confirm: 'Επιβεβαίωση', back: 'Πίσω', next: 'Επόμενο',
      finish: 'Ολοκλήρωση', ok: 'OK', timerStepWarning: 'Απομένουν {seconds} δευτερόλεπτα για αυτή την έκχυση',
      stepFinished: 'Βήμα ολοκληρώθηκε: {step}', brewingFinished: 'Η εκχύλιση ολοκληρώθηκε!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Εκχύλιση', beans: 'Κόκκοι', journal: 'Ημερολόγιο', dialin: 'Dial-in', caffeine: 'Καφεΐνη', settings: 'Ρυθμίσεις' },
  },
  tr: {
    appName: 'Steepwise',
    appTagline: 'Nitelikli kahve ve zanaatkar çayı asistanı',
    common: {
      cancel: 'İptal', save: 'Kaydet', delete: 'Sil', edit: 'Düzenle',
      close: 'Kapat', confirm: 'Onayla', back: 'Geri', next: 'İleri',
      finish: 'Tamamla', ok: 'Tamam', timerStepWarning: 'Bu döküş için {seconds} saniye kaldı',
      stepFinished: 'Adım tamamlandı: {step}', brewingFinished: 'Demleme tamamlandı!',
      grams: 'g', seconds: 'sn', celsius: '°C',
    },
    tabs: { brew: 'Demle', beans: 'Kiler', journal: 'Günlük', dialin: 'Dial-in', caffeine: 'Kafein', settings: 'Ayarlar' },
  },
  ru: {
    appName: 'Steepwise',
    appTagline: 'Ассистент для спешелти кофе и крафтового чая',
    common: {
      cancel: 'Отмена', save: 'Сохранить', delete: 'Удалить', edit: 'Изменить',
      close: 'Закрыть', confirm: 'Подтвердить', back: 'Назад', next: 'Далее',
      finish: 'Завершить', ok: 'OK', timerStepWarning: 'Осталось {seconds} секунд для этого пролива',
      stepFinished: 'Шаг завершен: {step}', brewingFinished: 'Заваривание завершено!',
      grams: 'г', seconds: 'сек', celsius: '°C',
    },
    tabs: { brew: 'Заваривание', beans: 'Зерно', journal: 'Журнал', dialin: 'Настройка', caffeine: 'Кофеин', settings: 'Настройки' },
  },
  uk: {
    appName: 'Steepwise',
    appTagline: 'Асистент для спешелті кави та крафтового чаю',
    common: {
      cancel: 'Скасувати', save: 'Зберегти', delete: 'Видалити', edit: 'Редагувати',
      close: 'Закрити', confirm: 'Підтвердити', back: 'Назад', next: 'Далі',
      finish: 'Завершити', ok: 'OK', timerStepWarning: 'Залишилось {seconds} секунд для цього протоку',
      stepFinished: 'Крок завершено: {step}', brewingFinished: 'Заварювання завершено!',
      grams: 'г', seconds: 'сек', celsius: '°C',
    },
    tabs: { brew: 'Заварювання', beans: 'Зерно', journal: 'Журнал', dialin: 'Налаштування', caffeine: 'Кофеїн', settings: 'Налаштування' },
  },
  ja: {
    appName: 'Steepwise',
    appTagline: 'スペシャルティコーヒー＆職人茶のドリップアシスタント',
    common: {
      cancel: 'キャンセル', save: '保存', delete: '削除', edit: '編集',
      close: '閉じる', confirm: '確認', back: '戻る', next: '次へ',
      finish: '完了', ok: 'OK', timerStepWarning: 'この注湯の残り時間はあと {seconds} 秒です',
      stepFinished: 'ステップ完了: {step}', brewingFinished: '抽出が完了しました！',
      grams: 'g', seconds: '秒', celsius: '°C',
    },
    tabs: { brew: '抽出', beans: 'ビーンズ', journal: '記録', dialin: 'ダイアルイン', caffeine: 'カフェイン', settings: '設定' },
  },
  ko: {
    appName: 'Steepwise',
    appTagline: '스페셜티 커피 및 수제 차 추출 도우미',
    common: {
      cancel: '취소', save: '저장', delete: '삭제', edit: '수정',
      close: '닫기', confirm: '확인', back: '뒤로', next: '다음',
      finish: '완료', ok: '확인', timerStepWarning: '이번 푸어 잔여 시간: {seconds}초',
      stepFinished: '단계 완료: {step}', brewingFinished: '추출이 완료되었습니다!',
      grams: 'g', seconds: '초', celsius: '°C',
    },
    tabs: { brew: '추출', beans: '원두', journal: '기록', dialin: '다이얼인', caffeine: '카페인', settings: '설정' },
  },
  'zh-Hans': {
    appName: 'Steepwise',
    appTagline: '精品咖啡与工夫茶萃取伴侣',
    common: {
      cancel: '取消', save: '保存', delete: '删除', edit: '编辑',
      close: '关闭', confirm: '确认', back: '返回', next: '下一步',
      finish: '完成', ok: '确定', timerStepWarning: '本次注水还剩 {seconds} 秒',
      stepFinished: '步骤完成: {step}', brewingFinished: '冲煮完成！',
      grams: 'g', seconds: '秒', celsius: '°C',
    },
    tabs: { brew: '冲煮', beans: '豆库', journal: '日志', dialin: '调幼', caffeine: '咖啡因', settings: '设置' },
  },
  'zh-Hant': {
    appName: 'Steepwise',
    appTagline: '精品咖啡與工夫茶沖煮助手',
    common: {
      cancel: '取消', save: '儲存', delete: '刪除', edit: '編輯',
      close: '關閉', confirm: '確認', back: '返回', next: '下一步',
      finish: '完成', ok: '確定', timerStepWarning: '本次注水還剩 {seconds} 秒',
      stepFinished: '步驟完成: {step}', brewingFinished: '沖煮完成！',
      grams: 'g', seconds: '秒', celsius: '°C',
    },
    tabs: { brew: '沖煮', beans: '豆庫', journal: '日誌', dialin: '調幼', caffeine: '咖啡因', settings: '設定' },
  },
  id: {
    appName: 'Steepwise',
    appTagline: 'Asisten kopi spesialti dan teh artisanal',
    common: {
      cancel: 'Batal', save: 'Simpan', delete: 'Hapus', edit: 'Edit',
      close: 'Tutup', confirm: 'Konfirmasi', back: 'Kembali', next: 'Lanjut',
      finish: 'Selesai', ok: 'OK', timerStepWarning: 'Tersisa {seconds} detik untuk tuangan ini',
      stepFinished: 'Langkah selesai: {step}', brewingFinished: 'Penyeduhan selesai!',
      grams: 'g', seconds: 'd', celsius: '°C',
    },
    tabs: { brew: 'Seduh', beans: 'Biji Kopi', journal: 'Jurnal', dialin: 'Dial-in', caffeine: 'Kafein', settings: 'Pengaturan' },
  },
  ms: {
    appName: 'Steepwise',
    appTagline: 'Pembantu kopi khas dan teh artisan',
    common: {
      cancel: 'Batal', save: 'Simpan', delete: 'Padam', edit: 'Sunting',
      close: 'Tutup', confirm: 'Sahkan', back: 'Kembali', next: 'Seterusnya',
      finish: 'Selesai', ok: 'OK', timerStepWarning: 'Tinggal {seconds} saat untuk tuangan ini',
      stepFinished: 'Langkah selesai: {step}', brewingFinished: 'Bancuhan selesai!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Bancuh', beans: 'Simpanan', journal: 'Jurnal', dialin: 'Dial-in', caffeine: 'Kafein', settings: 'Tetapan' },
  },
  th: {
    appName: 'Steepwise',
    appTagline: 'ผู้ช่วยชงกาแฟพิเศษและชาคราฟต์',
    common: {
      cancel: 'ยกเลิก', save: 'บันทึก', delete: 'ลบ', edit: 'แก้ไข',
      close: 'ปิด', confirm: 'ยืนยัน', back: 'ย้อนกลับ', next: 'ถัดไป',
      finish: 'เสร็จสิ้น', ok: 'ตกลง', timerStepWarning: 'เหลืออีก {seconds} วินาทีสำหรับการรินนี้',
      stepFinished: 'ขั้นตอนเสร็จสมบูรณ์: {step}', brewingFinished: 'การสกัดเสร็จสิ้น!',
      grams: 'กรัม', seconds: 'วินาที', celsius: '°C',
    },
    tabs: { brew: 'ชง', beans: 'เมล็ดกาแฟ', journal: 'บันทึก', dialin: 'Dial-in', caffeine: 'คาเฟอีน', settings: 'การตั้งค่า' },
  },
  vi: {
    appName: 'Steepwise',
    appTagline: 'Trợ lý cà phê đặc sản và trà thủ công',
    common: {
      cancel: 'Hủy', save: 'Lưu', delete: 'Xóa', edit: 'Sửa',
      close: 'Đóng', confirm: 'Xác nhận', back: 'Quay lại', next: 'Tiếp tục',
      finish: 'Hoàn thành', ok: 'OK', timerStepWarning: 'Còn {seconds} giây cho lần rót này',
      stepFinished: 'Đã hoàn thành bước: {step}', brewingFinished: 'Pha chế hoàn tất!',
      grams: 'g', seconds: 'giây', celsius: '°C',
    },
    tabs: { brew: 'Pha chế', beans: 'Kho hạt', journal: 'Nhật ký', dialin: 'Dial-in', caffeine: 'Caffeine', settings: 'Cài đặt' },
  },
  ar: {
    appName: 'Steepwise',
    appTagline: 'مساعد القهوة المختصة والشاي الحرفي',
    common: {
      cancel: 'إلغاء', save: 'حفظ', delete: 'حذف', edit: 'تعديل',
      close: 'إغلاق', confirm: 'تأكيد', back: 'رجوع', next: 'التالي',
      finish: 'إنهاء', ok: 'حسناً', timerStepWarning: 'تبقى {seconds} ثانية لهذه الصبة',
      stepFinished: 'اكتملت الخطوة: {step}', brewingFinished: 'اكتمل التحضير!',
      grams: 'غ', seconds: 'ث', celsius: '°C',
    },
    tabs: { brew: 'تحضير', beans: 'البن', journal: 'السجل', dialin: 'ضبط الطحنة', caffeine: 'كافيين', settings: 'الإعدادات' },
  },
  he: {
    appName: 'Steepwise',
    appTagline: 'עוזר לקפה ספיישלטי ותה בוטיק',
    common: {
      cancel: 'ביטול', save: 'שמירה', delete: 'מחיקה', edit: 'עריכה',
      close: 'סגירה', confirm: 'אישור', back: 'חזרה', next: 'הבא',
      finish: 'סיום', ok: 'אישור', timerStepWarning: 'נותרו {seconds} שניות למזיגה זו',
      stepFinished: 'שלב הושלם: {step}', brewingFinished: 'החליטה הסתיימה!',
      grams: 'גרם', seconds: 'שניות', celsius: '°C',
    },
    tabs: { brew: 'חליטה', beans: 'פולים', journal: 'יומן', dialin: 'כיוונון', caffeine: 'קפאין', settings: 'הגדרות' },
  },
  hi: {
    appName: 'Steepwise',
    appTagline: 'स्पेशलिटी कॉफी और कारीगर चाय सहायक',
    common: {
      cancel: 'रद्द करें', save: 'सहेजें', delete: 'हटाएं', edit: 'संपादित करें',
      close: 'बंद करें', confirm: 'पुष्टि करें', back: 'पीछे', next: 'आगे',
      finish: 'समाप्त', ok: 'ठीक है', timerStepWarning: 'इस पोर के लिए {seconds} सेकंड शेष हैं',
      stepFinished: 'चरण पूर्ण: {step}', brewingFinished: 'ब्रूइंग समाप्त!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'ब्रू', beans: 'भंडार', journal: 'डायरी', dialin: 'डायल-इन', caffeine: 'कैफीन', settings: 'सेटिंग्स' },
  },
  hr: {
    appName: 'Steepwise',
    appTagline: 'Pomoćnik za specialty kavu i zanatski čaj',
    common: {
      cancel: 'Odustani', save: 'Spremi', delete: 'Obriši', edit: 'Uredi',
      close: 'Zatvori', confirm: 'Potvrdi', back: 'Natrag', next: 'Dalje',
      finish: 'Završi', ok: 'U redu', timerStepWarning: 'Preostalo {seconds} sekundi za ovo prelijevanje',
      stepFinished: 'Korak dovršen: {step}', brewingFinished: 'Kuhanje završeno!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Priprema', beans: 'Ostava', journal: 'Dnevnik', dialin: 'Dial-in', caffeine: 'Kofein', settings: 'Postavke' },
  },
  ca: {
    appName: 'Steepwise',
    appTagline: 'Assistent de cafè d\'especialitat i te artesanal',
    common: {
      cancel: 'Cancel·la', save: 'Desa', delete: 'Elimina', edit: 'Edita',
      close: 'Tanca', confirm: 'Confirma', back: 'Enrere', next: 'Següent',
      finish: 'Finalitza', ok: 'D\'acord', timerStepWarning: 'Queden {seconds} segons per a aquesta abocada',
      stepFinished: 'Pas completat: {step}', brewingFinished: 'Extracció finalitzada!',
      grams: 'g', seconds: 's', celsius: '°C',
    },
    tabs: { brew: 'Infusió', beans: 'Rebost', journal: 'Diari', dialin: 'Dial-in', caffeine: 'Cafeïna', settings: 'Configuració' },
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
