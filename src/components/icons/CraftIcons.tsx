// ============================================================================
// Apps4Craft Studio — Minimalist Vector Icons (react-native-svg)
// Unified linear iconography for Napar, Piekarz, Słoik, Masaż & Ferment.
// Zero emojis, uniform 1.75pt stroke, rounded caps and joins.
// ============================================================================

import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** 1. Parzenie / Rytuał: Elegancki Dripper Pour-Over */
export function BrewIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Korpus drippera stożkowego V60 */}
      <Path
        d="M4 6h16l-5.5 10.5h-5L4 6z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Uchwyt drippera */}
      <Path
        d="M17.5 7.5c2 0 3.5 1 3.5 3s-1.5 3-3 3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Podstawa na serwerze */}
      <Path
        d="M8 19.5h8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Kropla esencji */}
      <Circle cx="12" cy="18" r="0.75" fill={color} />
    </Svg>
  );
}

/** 2. Spiżarnia / Surowce: Ziarno Kawy & Liść Herbaty */
export function BeansIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Zarys ziarna kawy */}
      <Path
        d="M12 21a8.5 8.5 0 0 0 8.5-8.5c0-4.5-3.5-8.5-8.5-8.5S3.5 8 3.5 12.5C3.5 17 7.5 21 12 21z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Rzemieślnicza bruzda w kształcie litery S */}
      <Path
        d="M12 4.5c2.5 3-2 5.5 0 8.5s-2 5 0 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 3. Dziennik / Kronika: Notatnik Degustacji ze wstążką */
export function JournalIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A2.5 2.5 0 0 1 7.5 2h10A2.5 2.5 0 0 1 20 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Grzbiet notatnika */}
      <Path
        d="M8.5 2v20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Linie degustacyjne */}
      <Path
        d="M12 7h5M12 11h4M12 15h3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 4. Warsztat / Laboratorium: Kompas Dial-in i Pomiary */
export function LabIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Igła kompasu sensorycznego */}
      <Path
        d="M15.5 8.5l-2.5 5-5 2.5 2.5-5 5-2.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="1.25" fill={color} />
    </Svg>
  );
}

/** 5. Kofeina & Metabolizm Snu: Fala energii i półtrwania */
export function CaffeineIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2.5L5.5 12h5l-1.5 9.5 8.5-10.5h-5L13 2.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Ustawienia i Narzędzia */
export function SettingsIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M4 17h16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="8" cy="7" r="2.5" fill="#1C1C1F" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="16" cy="17" r="2.5" fill="#1C1C1F" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** Młynek / Kliki (Grinder Burrs) */
export function GrinderIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 4v3M12 17v3M4 12h3M17 12h3M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** Start / Play */
export function PlayIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4.5l14 7.5-14 7.5v-15z"
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Pause */
export function PauseIcon({ size = 24, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="5" width="4" height="14" rx="1.5" fill={color} />
      <Rect x="14" y="5" width="4" height="14" rx="1.5" fill={color} />
    </Svg>
  );
}

/** Next / Forward */
export function NextStepIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 6l7 6-7 6V6zM17 6v12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Previous / Back */
export function PrevStepIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 6l-7 6 7 6V6zM7 6v12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Reset / Restart */
export function ResetIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Share / QR Code */
export function QrIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="14.5" y="3.5" width="6" height="6" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="3.5" y="14.5" width="6" height="6" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M15 15h2v2h-2zm3 3h2v2h-2zm-3 3h2v-2h-2zm6-3h-2v-2h2z"
        fill={color}
      />
    </Svg>
  );
}

/** Ulubione (Star) */
export function StarIcon({ size = 18, color = '#D97736', filled = false, strokeWidth = 1.75 }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
