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
  ChevronBackIcon,
  CloseIcon,
  CheckIcon,
  TeaLeafIcon,
  DropletIcon,
  LightningIcon,
  CompassIcon,
  TrashIcon,
  ArchiveIcon,
  BookIcon,
  CameraIcon,
  CopyIcon,
  EditIcon,
  FlameIcon,
  SnowflakeIcon,
  ShieldIcon,
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
      <ChevronBackIcon key="chevron-back" />,
      <CloseIcon key="close" />,
      <CheckIcon key="check" />,
      <TeaLeafIcon key="tea-leaf" />,
      <DropletIcon key="droplet" />,
      <LightningIcon key="lightning" />,
      <CompassIcon key="compass" />,
      <TrashIcon key="trash" />,
      <ArchiveIcon key="archive" />,
      <BookIcon key="book" />,
      <CameraIcon key="camera" />,
      <CopyIcon key="copy" />,
      <EditIcon key="edit" />,
      <FlameIcon key="flame" />,
      <SnowflakeIcon key="snowflake" />,
      <ShieldIcon key="shield" />,
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
      <ChevronBackIcon key="chevron-back-c" size={24} color="#C86A28" strokeWidth={2} />,
      <CloseIcon key="close-c" size={24} color="#C86A28" strokeWidth={2} />,
      <CheckIcon key="check-c" size={20} color="#4E9B6E" strokeWidth={2} />,
      <TeaLeafIcon key="tea-leaf-c" size={20} color="#4E9B6E" strokeWidth={2} />,
      <DropletIcon key="droplet-c" size={20} color="#5B8A61" strokeWidth={2} />,
      <LightningIcon key="lightning-c" size={20} color="#E0A838" strokeWidth={2} />,
      <CompassIcon key="compass-c" size={20} color="#C86A28" strokeWidth={2} />,
      <TrashIcon key="trash-c" size={20} color="#D9534F" strokeWidth={2} />,
      <ArchiveIcon key="archive-c" size={20} color="#A09C96" strokeWidth={2} />,
      <BookIcon key="book-c" size={20} color="#C86A28" strokeWidth={2} />,
      <CameraIcon key="camera-c" size={20} color="#F4EFEA" strokeWidth={2} />,
      <CopyIcon key="copy-c" size={20} color="#F4EFEA" strokeWidth={2} />,
      <EditIcon key="edit-c" size={20} color="#F4EFEA" strokeWidth={2} />,
      <FlameIcon key="flame-c" size={20} color="#D9534F" strokeWidth={2} />,
      <SnowflakeIcon key="snowflake-c" size={20} color="#3D84A8" strokeWidth={2} />,
      <ShieldIcon key="shield-c" size={20} color="#C86A28" strokeWidth={2} />,
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
