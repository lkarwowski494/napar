// ============================================================================
// Napar (Steepwise) — Unit Tests: parseDecimal (kropka i przecinek jako separator)
// ============================================================================

import { parseDecimal } from '../parse-decimal';

describe('parseDecimal', () => {
  test('akceptuje kropkę jako separator dziesiętny', () => {
    expect(parseDecimal('1.5')).toBe(1.5);
    expect(parseDecimal('16.67')).toBe(16.67);
  });

  test('akceptuje przecinek jako separator dziesiętny', () => {
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal('0,25')).toBe(0.25);
  });

  test('liczby całkowite i znak minus', () => {
    expect(parseDecimal('15')).toBe(15);
    expect(parseDecimal('-2')).toBe(-2);
    expect(parseDecimal('+3')).toBe(3);
    expect(parseDecimal('.5')).toBe(0.5);
    expect(parseDecimal('5.')).toBe(5);
  });

  test('ignoruje spacje na początku i końcu', () => {
    expect(parseDecimal('  1,5  ')).toBe(1.5);
    expect(parseDecimal(' 2.0 ')).toBe(2);
  });

  test('zwraca NaN dla pustego tekstu i samych spacji', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('   ')).toBeNaN();
  });

  test('zwraca NaN dla tekstu, który nie jest liczbą', () => {
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal(',')).toBeNaN();
    expect(parseDecimal('.')).toBeNaN();
    expect(parseDecimal('-')).toBeNaN();
  });

  test('zwraca NaN dla liczby z dodatkowymi znakami lub drugim separatorem', () => {
    expect(parseDecimal('12abc')).toBeNaN();
    expect(parseDecimal('1,5,3')).toBeNaN();
    expect(parseDecimal('1.2.3')).toBeNaN();
    expect(parseDecimal('1 500')).toBeNaN();
  });

  test('zwraca NaN dla wartości niebędącej tekstem', () => {
    expect(parseDecimal(undefined as unknown as string)).toBeNaN();
    expect(parseDecimal(15 as unknown as string)).toBeNaN();
  });
});
