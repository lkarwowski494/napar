// ============================================================================
// Napar (Steepwise) — Accessibility (a11y), Contrast & VoiceOver Tests
// WCAG 2.1 AA Contrast Ratios, VoiceOver Accessibility Roles & Touch Target Ergonomics
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { theme } from '../theme';
import { SensoryRadarChart, SensoryScoreEditor } from '../radar-chart';
import { FlavorWheelPicker } from '../flavor-wheel-picker';

// ----------------------------------------------------------------------------
// Matematyka kontrastu WCAG 2.1 (Relative Luminance & Contrast Ratio)
// ----------------------------------------------------------------------------
function parseHex(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

function sRgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function calculateWcagContrast(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

describe('WCAG 2.1 Color Contrast Audits (Dark Mode Theme)', () => {
  test('Kontrast tekstu głównego textPrimary do tła bg i kart bgCard spełnia normę WCAG AAA (≥ 7:1)', () => {
    const contrastBg = calculateWcagContrast(theme.colors.textPrimary, theme.colors.bg);
    const contrastCard = calculateWcagContrast(theme.colors.textPrimary, theme.colors.bgCard);

    // #F4EFEA na ciemnym tle #121214 daje bardzo wysoki, czytelny kontrast > 12:1
    expect(contrastBg).toBeGreaterThanOrEqual(7.0);
    expect(contrastCard).toBeGreaterThanOrEqual(7.0);
  });

  test('Kontrast tekstu pomocniczego textSecondary do tła spełnia normę WCAG AA (≥ 4.5:1)', () => {
    const contrastBg = calculateWcagContrast(theme.colors.textSecondary, theme.colors.bg);
    const contrastCard = calculateWcagContrast(theme.colors.textSecondary, theme.colors.bgCard);

    expect(contrastBg).toBeGreaterThanOrEqual(4.5);
    expect(contrastCard).toBeGreaterThanOrEqual(4.5);
  });

  test('Kontrast akcentów rzemieślniczych (copper, emerald) do tła spełnia normę dla elementów interfejsu (≥ 3.0:1)', () => {
    const contrastCopper = calculateWcagContrast(theme.colors.copper, theme.colors.bg);
    const contrastEmerald = calculateWcagContrast(theme.colors.emerald, theme.colors.bg);

    expect(contrastCopper).toBeGreaterThanOrEqual(3.0);
    expect(contrastEmerald).toBeGreaterThanOrEqual(3.0);
  });
});

describe('Audyt Dostępności Kontrolek i Etykiet VoiceOver (a11y roles & labels)', () => {
  test('Wykres radarowy posiada precyzyjne accessibilityLabel dla każdego steppera sensorycznego', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <SensoryScoreEditor
          profile={{ acidity: 3, sweetness: 4, body: 3, clarity: 4, finish: 3 }}
          onChange={() => {}}
          language="pl"
        />
      );
    });

    const root = tree.root;
    // Znajdź przyciski ze zdefiniowanym accessibilityLabel i zdarzeniem onPress
    const buttonsWithA11y = root.findAll(
      (n: any) => n.props?.accessibilityLabel && typeof n.props?.onPress === 'function'
    );

    expect(buttonsWithA11y.length).toBe(10); // 5 cech smakowych x 2 steppery (+ i −)

    const labels = buttonsWithA11y.map((b: any) => b.props.accessibilityLabel);
    expect(labels.some((l: string) => l.includes('Zwiększ Kwasowość'))).toBe(true);
    expect(labels.some((l: string) => l.includes('Zmniejsz Kwasowość'))).toBe(true);
    expect(labels.some((l: string) => l.includes('Zwiększ Słodycz'))).toBe(true);
  });

  test('Koło smaków SCA poprawnie udostępnia kategorie z rolami przycisków dla czytników ekranu', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <FlavorWheelPicker
          selectedDescriptors={['Jaśmin']}
          onToggleDescriptor={() => {}}
        />
      );
    });

    const root = tree.root;
    // Sprawdź czy chipy posiadają rolę accessibilityRole lub obsługę zdarzenia onPress
    const interactiveChips = root.findAll((n: any) => n.props?.accessibilityRole === 'button' || typeof n.props?.onPress === 'function');
    expect(interactiveChips.length).toBeGreaterThan(10);
  });
});

describe('Ergonomia i Wytyczne Apple Human Interface Guidelines (Touch Targets)', () => {
  test('Promienie zaokrąglenia i marginesy motywu zachowują spójną siatkę 4pt/8pt', () => {
    expect(theme.spacing.xs % 4).toBe(0);
    expect(theme.spacing.sm % 4).toBe(0);
    expect(theme.spacing.md % 4).toBe(0);
    expect(theme.spacing.lg % 4).toBe(0);
    expect(theme.spacing.xl % 4).toBe(0);

    expect(theme.borderRadius.sm).toBeGreaterThanOrEqual(4);
    expect(theme.borderRadius.md).toBeGreaterThanOrEqual(8);
  });
});
