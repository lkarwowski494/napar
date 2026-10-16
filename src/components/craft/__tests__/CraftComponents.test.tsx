// ============================================================================
// Apps4Craft Unified Design System — Component Tests
// Verifying clickability, safe area adherence, and accessibility across all standard components.
// ============================================================================

import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import {
  CraftHeader,
  CraftButton,
  CraftCard,
  CraftStatDisplay,
  CraftModal,
} from '../index';

// Mock safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));

describe('CraftHeader', () => {
  it('renderuje tytuł oraz opcjonalny podtytuł', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftHeader title="Kalkulator Hydratacji" subtitle="Piekarz Craft Suite" />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Kalkulator Hydratacji');
    expect(str).toContain('Piekarz Craft Suite');
  });

  it('obsługuje kliknięcie przycisku wstecz (onBack)', () => {
    const onBackMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftHeader title="Procedura Zakwasu" onBack={onBackMock} />
      );
    });
    const backBtn = tree.root.findByProps({ testID: 'craft-header-back' });
    expect(backBtn).toBeTruthy();
    act(() => backBtn.props.onPress());
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('obsługuje kliknięcie przycisku zamknij (onClose)', () => {
    const onCloseMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftHeader title="Ustawienia Solanki" onClose={onCloseMock} />
      );
    });
    const closeBtn = tree.root.findByProps({ testID: 'craft-header-close' });
    expect(closeBtn).toBeTruthy();
    act(() => closeBtn.props.onPress());
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renderuje niestandardowy slot akcji po prawej stronie', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftHeader
          title="Dziennik Wędlin"
          rightAction={<Text testID="custom-action">ZAPISZ</Text>}
        />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('ZAPISZ');
  });
});

describe('CraftButton', () => {
  it('renderuje etykietę i reaguje na kliknięcie', () => {
    const onPressMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftButton label="ROZPOCZNIJ FERMENTACJĘ" onPress={onPressMock} />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('ROZPOCZNIJ FERMENTACJĘ');

    const button = tree.root.findByProps({ testID: 'craft-button' });
    act(() => button.props.onPress());
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('nie wywołuje onPress gdy przycisk jest nieaktywny (disabled)', () => {
    const onPressMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftButton label="ZAPARZ" onPress={onPressMock} disabled />
      );
    });
    const button = tree.root.findByProps({ testID: 'craft-button' });
    act(() => button.props.onPress());
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('nie wywołuje onPress i pokazuje wskaźnik ładowania gdy loading=true', () => {
    const onPressMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftButton label="ZAPARZ" onPress={onPressMock} loading />
      );
    });

    const activityIndicator = tree.root.findByType('ActivityIndicator');
    expect(activityIndicator).toBeTruthy();

    const textNodes = tree.root.findAll((node: any) => node.type === 'Text' && node.props?.children === 'ZAPARZ');
    expect(textNodes).toHaveLength(0);

    const button = tree.root.findByProps({ testID: 'craft-button' });
    act(() => button.props.onPress());
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('obsługuje ikony po lewej i prawej stronie', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftButton
          label="DALEJ"
          onPress={() => {}}
          icon={<Text>▶</Text>}
          iconPosition="right"
        />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('▶');
    expect(str).toContain('DALEJ');
  });
});

describe('CraftCard', () => {
  it('renderuje zawartość i nagłówek z ikoną i badge', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftCard
          headerTitle="Parametry ciasta"
          headerBadge={<Text>PRO</Text>}
          headerIcon={<Text>🥖</Text>}
        >
          <Text>Mąka typ 750: 500g</Text>
        </CraftCard>
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Parametry ciasta');
    expect(str).toContain('PRO');
    expect(str).toContain('🥖');
    expect(str).toContain('Mąka typ 750: 500g');
  });

  it('reaguje na kliknięcie gdy przekazano onPress', () => {
    const onPressMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftCard onPress={onPressMock}>
          <Text>Klikalna karta</Text>
        </CraftCard>
      );
    });
    const card = tree.root.findByProps({ testID: 'craft-card' });
    act(() => card.props.onPress());
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

describe('CraftStatDisplay', () => {
  it('prezentuje kluczowe parametry rzemieślnicze z jednostką i podpisem', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftStatDisplay
          label="Hydratacja"
          value="75"
          unit="%"
          subtext="Ciasto pszenno-żytnie"
          accentColor="#D49B42"
          size="lg"
        />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Hydratacja');
    expect(str).toContain('75');
    expect(str).toContain('%');
    expect(str).toContain('Ciasto pszenno-żytnie');
  });
});

describe('CraftModal', () => {
  it('renderuje modal i umożliwia zamknięcie przez przycisk nagłówka', () => {
    const onCloseMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftModal
          visible={true}
          onClose={onCloseMock}
          title="Konfiguracja Peklosoli"
          subtitle="Masaż Craft Studio"
          footer={<Text>Stopka modala</Text>}
        >
          <Text>Treść modala rzemieślniczego</Text>
        </CraftModal>
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Konfiguracja Peklosoli');
    expect(str).toContain('Masaż Craft Studio');
    expect(str).toContain('Treść modala rzemieślniczego');
    expect(str).toContain('Stopka modala');

    const closeBtn = tree.root.findByProps({ testID: 'craft-header-close' });
    act(() => closeBtn.props.onPress());
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('obsługuje tryb nieprzewijany (scrollable=false)', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CraftModal
          visible={true}
          onClose={() => {}}
          title="Prosty modal"
          scrollable={false}
        >
          <Text>Nieprzewijana zawartość</Text>
        </CraftModal>
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Nieprzewijana zawartość');
  });
});
