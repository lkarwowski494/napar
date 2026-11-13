// ============================================================================
// Napar — błąd walidacji danych użytkownika (M1-audytor-generalny-008; 08-programista-004)
// Brak albo zła wartość nie jest zastępowana zgadniętą liczbą: zapis rzuca ten błąd i niczego nie zapisuje.
// ============================================================================

export class DataValidationError extends Error {
  constructor(public readonly field: string) {
    super(`Nieprawidłowa wartość pola „${field}”: niczego nie zapisano`);
    this.name = 'DataValidationError';
  }
}
