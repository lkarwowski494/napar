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

// ============================================================================
// Apps4Craft Family Emblems (The 5 Culinary Crafts)
// ============================================================================

/** ☕ 1. Napar — Ekstrakcja Kawy Specialty i Herbaty Rzemieślniczej */
export function NaparAppIcon({ size = 28, color = '#C86A28', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dripper stożkowy V60 z uchwytem */}
      <Path
        d="M4 5h16l-5.5 11h-5L4 5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 6.5c2 0 3.5 1.2 3.5 3.2s-1.5 3.2-3 3.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Podstawa serwera */}
      <Path d="M8 20h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Kropla esencji */}
      <Circle cx="12" cy="18.5" r="1.1" fill={color} />
      {/* Subtelne żebra spiralne */}
      <Path d="M9 7.5l2 5M15 7.5l-2 5" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

/** 🥖 2. Piekarz — Chleb Rzemieślniczy, Zakwas i Piekarska Hydratacja */
export function PiekarzAppIcon({ size = 28, color = '#D49B42', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bochenek chleba boule (okrągły bochen na zakwasie) */}
      <Path
        d="M4 16c0-6 3.5-11 8-11s8 5 8 11H4z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Podstawa z deski piekarskiej */}
      <Path d="M3 18.5h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Nacięcie żyletką (Scoring Ear / Kłos żyta) */}
      <Path
        d="M8.5 13.5c2.5-3 5-3.5 7-1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 10.5l1.5 2M12.5 9l1.5 2M14.5 10l1 1.5" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 🫙 3. Słoik — Kiszonki, Solanki, Octy i Fermentacja Warzyw */
export function SloikAppIcon({ size = 28, color = '#5B8A61', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Korpus słoika Weck z zaokrąglonymi ramionami */}
      <Path
        d="M6 8h12v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Szklana pokrywa */}
      <Path
        d="M7 5h10v3H7V5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Druciana klamra sprężynowa Weck */}
      <Path d="M5 8h14M8 5V3.5h8V5" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinecap="round" />
      {/* Pęcherzyki CO2 solanki */}
      <Circle cx="10" cy="14" r="1.2" stroke={color} strokeWidth={strokeWidth * 0.7} />
      <Circle cx="14" cy="11.5" r="0.9" stroke={color} strokeWidth={strokeWidth * 0.7} />
      <Circle cx="12" cy="16.5" r="0.75" stroke={color} strokeWidth={strokeWidth * 0.7} />
    </Svg>
  );
}

/** 🥩 4. Masaż — Wędliny, Sezonowanie, Peklosól i Wędzenie */
export function MasazAppIcon({ size = 28, color = '#A43E38', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Kawałek dojrzewającego mięsa / szynki */}
      <Path
        d="M5.5 16.5c-2-2-1.5-6 1-8.5s6.5-3 8.5-1c3 3 5 4 5 7.5 0 4-3.5 7.5-7.5 7.5-3.5 0-5-3.5-7-5.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sznurek wędzarniczy / oplot rzeźnicki */}
      <Path
        d="M8.5 10c1.5 2 4.5 3 7.5 2M7.5 14c2 1 4 0.5 6-1"
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Kość szpikowa */}
      <Circle cx="15.5" cy="8.5" r="1.5" stroke={color} strokeWidth={strokeWidth * 0.85} />
    </Svg>
  );
}

/** 🧀 5. Ferment — Sery Rzemieślnicze, Skrzep, Dojrzewalnia i pH */
export function FermentAppIcon({ size = 28, color = '#E0A838', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Krąg sera w rzucie z góry/izometrycznym */}
      <Path
        d="M12 4L3 8.5v7l9 4.5 9-4.5v-7L12 4z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wycięty klin serowy */}
      <Path
        d="M12 4v8l9-4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12l-7-3.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Oczka dojrzewania sera */}
      <Circle cx="7.5" cy="14" r="1.1" stroke={color} strokeWidth={strokeWidth * 0.75} />
      <Circle cx="15" cy="15" r="0.9" stroke={color} strokeWidth={strokeWidth * 0.75} />
    </Svg>
  );
}

/** 👑 6. Herb Rodziny Apps4Craft Studio */
export function CraftFamilyEmblem({ size = 32, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Zewnętrzna rzemieślnicza tarcza (squircle) */}
      <Rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Centralna geometryczna gwiazda 5 rzemiosł kuchennych */}
      <Path
        d="M12 6.5v11M6.5 12h11M8.5 8.5l7 7M15.5 8.5l-7 7"
        stroke={color}
        strokeWidth={strokeWidth * 0.75}
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Rdzeń tarczy */}
      <Circle cx="12" cy="12" r="2.2" stroke={color} strokeWidth={strokeWidth} fill="#121214" />
    </Svg>
  );
}

/** 7. Nawigacja Wstecz (Chevron Back) */
export function ChevronBackIcon({ size = 24, color = '#F4EFEA', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 8. Zamknięcie (Close X) */
export function CloseIcon({ size = 24, color = '#F4EFEA', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 9. Znacznik Potwierdzenia (Checkmark) */
export function CheckIcon({ size = 20, color = '#4E9F3D', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 10. Liść Herbaty (Tea Leaf) */
export function TeaLeafIcon({ size = 24, color = '#2A7B62', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.2 12.2a6 6 0 0 0-8.4-8.4L5 10.5V19h8.5l6.7-6.8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8L3 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 11. Kropla Wody (Droplet) */
export function DropletIcon({ size = 20, color = '#3D84A8', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 12. Błyskawica / Kofeina (Lightning) */
export function LightningIcon({ size = 20, color = '#E5A96A', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 13. Kompas / Sensor (Compass) */
export function CompassIcon({ size = 20, color = '#C86A28', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 14. Kosz / Usuń (Trash) */
export function TrashIcon({ size = 20, color = '#D9534F', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 15. Archiwizuj / Paczka (Archive Box) */
export function ArchiveIcon({ size = 20, color = '#A09C96', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8v13H3V8M1 3h22v5H1V3zM10 12h4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 16. Księga / Kompendium (Book) */
export function BookIcon({ size = 20, color = '#C86A28', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 17. Aparat / Skaner QR (Camera) */
export function CameraIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** 18. Kopiuj / Duplikuj (Copy) */
export function CopyIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 19. Edytuj / Ołówek (Edit) */
export function EditIcon({ size = 20, color = '#F4EFEA', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 20. Ogień / Podnieś Temperaturę (Flame) */
export function FlameIcon({ size = 20, color = '#D9534F', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 14.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5c0-2-1.5-3.5-2.5-4.5-.5 1-1.5 1.5-2 1.5-1 0-2.5-1.5-2.5-3.5 0-3 3-5 5.5-6-1.5 3 2 4.5 2 7.5A6 6 0 1 1 6 14.5c0-1.5.5-3 1.5-4.5.5 2 1 4.5 1 4.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 21. Śnieżynka / Obniż Temperaturę (Snowflake) */
export function SnowflakeIcon({ size = 20, color = '#3D84A8', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 22. Tarcza Bezpieczeństwa / Offline (Shield) */
export function ShieldIcon({ size = 20, color = '#4E9F3D', strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

