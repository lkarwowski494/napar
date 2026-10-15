// ============================================================================
// Napar (Steepwise) — Unit Tests: Sensory Radar Chart
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import {
  SensoryRadarChart,
  SensoryScoreEditor,
  DEFAULT_SENSORY_PROFILE,
  SensoryProfile,
} from '../radar-chart';

describe('SensoryRadarChart', () => {
  it('renders SVG radar chart with 5 axes in Polish', () => {
    const profile: SensoryProfile = {
      acidity: 4,
      sweetness: 5,
      body: 3,
      clarity: 4,
      finish: 3,
    };

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <SensoryRadarChart profile={profile} size={220} language="pl" />
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);
    expect(str).toContain('Kwasowość');
    expect(str).toContain('Słodycz');
    expect(str).toContain('Ciało');
    expect(str).toContain('Czystość');
    expect(str).toContain('Finisz');
  });

  it('renders English labels when language is en', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <SensoryRadarChart profile={DEFAULT_SENSORY_PROFILE} language="en" />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Acidity');
    expect(str).toContain('Sweetness');
    expect(str).toContain('Body');
    expect(str).toContain('Clarity');
    expect(str).toContain('Finish');
  });
});

describe('SensoryScoreEditor', () => {
  it('renders initial profile scores', () => {
    const profile: SensoryProfile = {
      acidity: 2,
      sweetness: 4,
      body: 3,
      clarity: 5,
      finish: 1,
    };

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <SensoryScoreEditor profile={profile} onChange={jest.fn()} language="pl" />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('2 / 5');
    expect(str).toContain('4 / 5');
    expect(str).toContain('3 / 5');
    expect(str).toContain('5 / 5');
    expect(str).toContain('1 / 5');
  });

  it('calls onChange with updated value when incrementing and decrementing', () => {
    const onChange = jest.fn();
    const profile: SensoryProfile = {
      acidity: 3,
      sweetness: 3,
      body: 3,
      clarity: 3,
      finish: 3,
    };

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <SensoryScoreEditor profile={profile} onChange={onChange} language="pl" />
      );
    });

    const incAcidityBtn = tree.root.findByProps({
      accessibilityLabel: 'Zwiększ Kwasowość',
    });
    renderer.act(() => {
      incAcidityBtn.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...profile,
      acidity: 4,
    });

    const decSweetnessBtn = tree.root.findByProps({
      accessibilityLabel: 'Zmniejsz Słodycz',
    });
    renderer.act(() => {
      decSweetnessBtn.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...profile,
      sweetness: 2,
    });
  });
});
