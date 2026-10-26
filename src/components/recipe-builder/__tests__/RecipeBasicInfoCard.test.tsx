import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecipeBasicInfoCard } from '../RecipeBasicInfoCard';
import { translations } from '../../../core/i18n';

describe('RecipeBasicInfoCard Component (TASK-P33-01-ODK)', () => {
  const defaultProps = {
    name: 'Mój V60',
    onChangeName: jest.fn(),
    method: 'V60',
    onChangeMethod: jest.fn(),
    author: 'Barista',
    onChangeAuthor: jest.fn(),
    description: 'Pyszny napar',
    onChangeDescription: jest.fn(),
    t: translations.pl,
  };

  test('renderuje pola z prawidłowymi etykietami dostępności accessibilityLabel', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<RecipeBasicInfoCard {...defaultProps} />);
    });

    const nameField = tree.root.findByProps({ testID: 'recipe-name-field' });
    expect(nameField.props.accessibilityLabel).toBe(translations.pl.recipeBuilder.nameLabel);
    expect(nameField.props.value).toBe('Mój V60');

    const methodField = tree.root.findByProps({ testID: 'recipe-method-field' });
    expect(methodField.props.accessibilityLabel).toBe(translations.pl.recipeBuilder.methodLabel);
    expect(methodField.props.value).toBe('V60');

    const authorField = tree.root.findByProps({ testID: 'recipe-author-field' });
    expect(authorField.props.accessibilityLabel).toBe(translations.pl.recipeBuilder.authorLabel);
    expect(authorField.props.value).toBe('Barista');

    const descField = tree.root.findByProps({ testID: 'recipe-description-field' });
    expect(descField.props.accessibilityLabel).toBe(translations.pl.recipeBuilder.descriptionLabel);
    expect(descField.props.value).toBe('Pyszny napar');
  });

  test('wywołuje handlery onChangeText po edycji danych', () => {
    const onChangeName = jest.fn();
    const onChangeMethod = jest.fn();
    const onChangeAuthor = jest.fn();
    const onChangeDescription = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeBasicInfoCard
          {...defaultProps}
          onChangeName={onChangeName}
          onChangeMethod={onChangeMethod}
          onChangeAuthor={onChangeAuthor}
          onChangeDescription={onChangeDescription}
        />
      );
    });

    const nameField = tree.root.findByProps({ testID: 'recipe-name-field' });
    nameField.props.onChangeText('Nowa Kawa');
    expect(onChangeName).toHaveBeenCalledWith('Nowa Kawa');

    const methodField = tree.root.findByProps({ testID: 'recipe-method-field' });
    methodField.props.onChangeText('Chemex');
    expect(onChangeMethod).toHaveBeenCalledWith('Chemex');

    const authorField = tree.root.findByProps({ testID: 'recipe-author-field' });
    authorField.props.onChangeText('Mistrz');
    expect(onChangeAuthor).toHaveBeenCalledWith('Mistrz');

    const descField = tree.root.findByProps({ testID: 'recipe-description-field' });
    descField.props.onChangeText('Zbalansowana');
    expect(onChangeDescription).toHaveBeenCalledWith('Zbalansowana');
  });

  test('TASK-P48-04-STU: limity dlugosci pol, accessibilityHint oraz odpornosc na undefined', () => {
    const onChangeName = jest.fn();
    const onChangeMethod = jest.fn();
    const onChangeAuthor = jest.fn();
    const onChangeDescription = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeBasicInfoCard
          {...defaultProps}
          name={undefined as any}
          method={undefined as any}
          author={undefined as any}
          description={undefined as any}
          onChangeName={onChangeName}
          onChangeMethod={onChangeMethod}
          onChangeAuthor={onChangeAuthor}
          onChangeDescription={onChangeDescription}
        />
      );
    });

    const nameField = tree.root.findByProps({ testID: 'recipe-name-field' });
    expect(nameField.props.value).toBe('');
    expect(nameField.props.maxLength).toBe(100);
    expect(nameField.props.accessibilityHint).toBeDefined();

    const methodField = tree.root.findByProps({ testID: 'recipe-method-field' });
    expect(methodField.props.value).toBe('');
    expect(methodField.props.maxLength).toBe(50);
    expect(methodField.props.accessibilityHint).toBeDefined();

    const authorField = tree.root.findByProps({ testID: 'recipe-author-field' });
    expect(authorField.props.value).toBe('');
    expect(authorField.props.maxLength).toBe(50);
    expect(authorField.props.accessibilityHint).toBeDefined();

    const descField = tree.root.findByProps({ testID: 'recipe-description-field' });
    expect(descField.props.value).toBe('');
    expect(descField.props.maxLength).toBe(1000);
    expect(descField.props.accessibilityHint).toBeDefined();

    // Weryfikacja przycinania przy zbyt długim wejściu
    nameField.props.onChangeText('A'.repeat(150));
    expect(onChangeName).toHaveBeenCalledWith('A'.repeat(100));

    methodField.props.onChangeText('M'.repeat(80));
    expect(onChangeMethod).toHaveBeenCalledWith('M'.repeat(50));
  });
});
