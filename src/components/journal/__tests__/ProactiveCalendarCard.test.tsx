import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProactiveCalendarCard } from '../ProactiveCalendarCard';

describe('ProactiveCalendarCard Component', () => {
  const defaultProps = {
    inventory: [],
    sessions: [],
    language: 'pl' as const,
    referenceDateIso: '2026-10-26T10:00:00.000Z',
    onExecuteAction: jest.fn(),
  };

  test('TASK-P30-01-ODK: przelacznik harmonogramu deklaruje radiogroup, role radio, selected oraz accessibilityHint', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(<ProactiveCalendarCard {...defaultProps} language="pl" />);
    });

    const radiogroupPl = treePl.root.findByProps({ accessibilityRole: 'radiogroup' });
    expect(radiogroupPl.props.accessibilityLabel).toBe('Filtruj harmonogram akcji');

    const upcomingBtnPl = treePl.root.findByProps({ testID: 'schedule-filter-upcoming' });
    const allBtnPl = treePl.root.findByProps({ testID: 'schedule-filter-all' });

    expect(upcomingBtnPl.props.accessibilityRole).toBe('radio');
    expect(upcomingBtnPl.props.accessibilityState).toEqual({ selected: true });
    expect(upcomingBtnPl.props.accessibilityHint).toBe('Wyświetla najbliższe zaplanowane akcje parzenia');

    expect(allBtnPl.props.accessibilityRole).toBe('radio');
    expect(allBtnPl.props.accessibilityState).toEqual({ selected: false });
    expect(allBtnPl.props.accessibilityHint).toBe('Wyświetla wszystkie zaplanowane akcje');

    // Kliknięcie "all" zmienia stan zaznaczenia
    act(() => {
      allBtnPl.props.onPress();
    });

    expect(upcomingBtnPl.props.accessibilityState).toEqual({ selected: false });
    expect(allBtnPl.props.accessibilityState).toEqual({ selected: true });

    // Wersja angielska
    let treeEn: any;
    act(() => {
      treeEn = renderer.create(<ProactiveCalendarCard {...defaultProps} language="en" />);
    });

    const radiogroupEn = treeEn.root.findByProps({ accessibilityRole: 'radiogroup' });
    expect(radiogroupEn.props.accessibilityLabel).toBe('Filter actions schedule');

    const upcomingBtnEn = treeEn.root.findByProps({ testID: 'schedule-filter-upcoming' });
    expect(upcomingBtnEn.props.accessibilityHint).toBe('Shows upcoming proactive brewing actions');
  });
});
