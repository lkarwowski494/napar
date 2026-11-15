// Plik-próbka dla testu kontroli tekstów (M1-audytor-generalny-033): kontrola check:i18n MUSI
// się czerwienić na każdym z poniższych wzorców. Plik nie jest częścią aplikacji (tests/fixtures).
import React from 'react';
import { Text, Pressable } from 'react-native';

export function I18nLiteralFixture({ isEn }: { isEn: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Zapisz paczkę">
      <Text>Receptura dnia</Text>
      <Text>{isEn ? 'Fixture choice' : 'Wybór próbki'}</Text>
    </Pressable>
  );
}
