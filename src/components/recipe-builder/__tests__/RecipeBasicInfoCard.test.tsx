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
});
