// ============================================================================
// Apps4Craft Studio — Unit Tests: CraftIcons (Vector SVG Iconography)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import {
  BrewIcon,
  BeansIcon,
  JournalIcon,
  LabIcon,
  CaffeineIcon,
  SettingsIcon,
  GrinderIcon,
  PlayIcon,
  PauseIcon,
  NextStepIcon,
  PrevStepIcon,
  ResetIcon,
  QrIcon,
  StarIcon,
  NaparAppIcon,
  PiekarzAppIcon,
  SloikAppIcon,
  MasazAppIcon,
  FermentAppIcon,
  CraftFamilyEmblem,
} from '../CraftIcons';

describe('CraftIcons Component Suite', () => {
  it('renders all vector icons with default props', () => {
    const iconsWithDefaults = [
      <BrewIcon key="brew" />,
      <BeansIcon key="beans" />,
      <JournalIcon key="journal" />,
      <LabIcon key="lab" />,
      <CaffeineIcon key="caffeine" />,
      <SettingsIcon key="settings" />,
      <GrinderIcon key="grinder" />,
      <PlayIcon key="play" />,
      <PauseIcon key="pause" />,
      <NextStepIcon key="next" />,
      <PrevStepIcon key="prev" />,
      <ResetIcon key="reset" />,
      <QrIcon key="qr" />,
      <StarIcon key="star" />,
      <NaparAppIcon key="napar-app" />,
      <PiekarzAppIcon key="piekarz-app" />,
      <SloikAppIcon key="sloik-app" />,
      <MasazAppIcon key="masaz-app" />,
      <FermentAppIcon key="ferment-app" />,
      <CraftFamilyEmblem key="family-emblem" />,
    ];

    iconsWithDefaults.forEach((icon) => {
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(icon);
      });
      expect(tree.toJSON()).toBeDefined();
    });
  });

  it('renders all vector icons with explicit custom props', () => {
    const iconsWithCustomProps = [
      <BrewIcon key="brew-c" size={28} color="#C86A28" strokeWidth={2} />,
      <BeansIcon key="beans-c" size={28} color="#C86A28" strokeWidth={2} />,
      <JournalIcon key="journal-c" size={28} color="#C86A28" strokeWidth={2} />,
      <LabIcon key="lab-c" size={28} color="#C86A28" strokeWidth={2} />,
      <CaffeineIcon key="caffeine-c" size={28} color="#C86A28" strokeWidth={2} />,
      <SettingsIcon key="settings-c" size={28} color="#C86A28" strokeWidth={2} />,
      <GrinderIcon key="grinder-c" size={16} color="#C86A28" strokeWidth={2} />,
      <PlayIcon key="play-c" size={20} color="#FFFFFF" strokeWidth={2} />,
      <PauseIcon key="pause-c" size={20} color="#FFFFFF" strokeWidth={2} />,
      <NextStepIcon key="next-c" size={20} color="#C86A28" strokeWidth={2} />,
      <PrevStepIcon key="prev-c" size={20} color="#A39E95" strokeWidth={2} />,
      <ResetIcon key="reset-c" size={18} color="#D9534F" strokeWidth={2} />,
      <QrIcon key="qr-c" size={22} color="#C86A28" strokeWidth={2} />,
      <StarIcon key="star-c-empty" size={16} color="#C86A28" filled={false} strokeWidth={2} />,
      <StarIcon key="star-c-filled" size={16} color="#C86A28" filled={true} strokeWidth={2} />,
      <NaparAppIcon key="napar-app-c" size={36} color="#C86A28" strokeWidth={2} />,
      <PiekarzAppIcon key="piekarz-app-c" size={36} color="#D49B42" strokeWidth={2} />,
      <SloikAppIcon key="sloik-app-c" size={36} color="#5B8A61" strokeWidth={2} />,
      <MasazAppIcon key="masaz-app-c" size={36} color="#A43E38" strokeWidth={2} />,
      <FermentAppIcon key="ferment-app-c" size={36} color="#E0A838" strokeWidth={2} />,
      <CraftFamilyEmblem key="family-emblem-c" size={40} color="#F4EFEA" strokeWidth={2} />,
    ];

    iconsWithCustomProps.forEach((icon) => {
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(icon);
      });
      expect(tree.toJSON()).toBeDefined();
    });
  });
});
