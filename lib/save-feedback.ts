// ============================================================================
// Napar — zapis danych użytkownika z obsługą błędu w handlerach UI
// M1-audytor-generalny-007 (08-programista-007, 05-architekt-011): wyjątek z zapisu w obsłudze zdarzenia
// nie trafia do granicy błędów React, więc bez tego aplikacja zamyka się albo gubi formularz.
// Plik w lib/ (warstwa UI), bo src/core nie importuje react-native (CLAUDE.md).
// ============================================================================

import { Alert } from 'react-native';
import { DataValidationError } from '../src/core/validation-error';

export interface SaveErrorTexts {
  saveErrorTitle: string;
  saveErrorDesc: string;
  invalidValueTitle: string;
  invalidValueDesc: string;
}

/**
 * Wykonuje zapis; przy błędzie pokazuje komunikat i zwraca false. Wywołujący przy false
 * nie zamyka formularza ani nie pokazuje „Zapisano”, więc wpisane dane zostają na ekranie.
 */
export function runSave(operation: () => void, texts: SaveErrorTexts): boolean {
  try {
    operation();
    return true;
  } catch (err) {
    // M1-audytor-generalny-008: zła wartość w formularzu to inny komunikat niż awaria zapisu.
    if (err instanceof DataValidationError) Alert.alert(texts.invalidValueTitle, texts.invalidValueDesc);
    else Alert.alert(texts.saveErrorTitle, texts.saveErrorDesc);
    return false;
  }
}
