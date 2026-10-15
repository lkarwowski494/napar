// ============================================================================
// Napar (Steepwise) — Hierarchiczne Koło Smaków SCA (SCA Flavor Wheel)
// Zgodne z oficjalną taksonomią Specialty Coffee Association i World Coffee Research
// ============================================================================

export interface FlavorCategory {
  id: string;
  namePl: string;
  color: string;
  subcategories: {
    namePl: string;
    descriptors: string[];
  }[];
}

export const SCA_FLAVOR_WHEEL: FlavorCategory[] = [
  {
    id: 'fruity',
    namePl: 'Owoce 🍓',
    color: '#D9534F',
    subcategories: [
      {
        namePl: 'Cytrusowe',
        descriptors: ['Cytryna', 'Limonka', 'Grejpfrut', 'Pomarańcza', 'Bergamotka'],
      },
      {
        namePl: 'Jagodowe',
        descriptors: ['Jagoda', 'Jeżyna', 'Malina', 'Truskawka', 'Czarna porzeczka'],
      },
      {
        namePl: 'Pestkowe',
        descriptors: ['Brzoskwinia', 'Morela', 'Wiśnia', 'Śliwka'],
      },
      {
        namePl: 'Tropikalne',
        descriptors: ['Mango', 'Marakuja', 'Ananas', 'Papaja'],
      },
      {
        namePl: 'Suszone owoce',
        descriptors: ['Rodzynki', 'Suszona śliwka', 'Figa', 'Daktyle'],
      },
    ],
  },
  {
    id: 'sweet',
    namePl: 'Słodycz & Czekolada 🍫',
    color: '#D97736',
    subcategories: [
      {
        namePl: 'Czekolada',
        descriptors: ['Ciemna czekolada', 'Mleczna czekolada', 'Kakao'],
      },
      {
        namePl: 'Karmel & Cukier',
        descriptors: ['Karmel', 'Toffee', 'Cukier trzcinowy', 'Melasa', 'Miód'],
      },
      {
        namePl: 'Wanilia & Krem',
        descriptors: ['Wanilia', 'Nugat', 'Masło'],
      },
    ],
  },
  {
    id: 'floral',
    namePl: 'Kwiatowe 🌸',
    color: '#C060A8',
    subcategories: [
      {
        namePl: 'Białe kwiaty',
        descriptors: ['Jaśmin', 'Kwiat pomarańczy', 'Czarny bez'],
      },
      {
        namePl: 'Aromatyczne',
        descriptors: ['Róża', 'Lawenda', 'Hibiskus', 'Rumianek'],
      },
    ],
  },
  {
    id: 'nutty',
    namePl: 'Orzechy & Prażone 🌰',
    color: '#8C6239',
    subcategories: [
      {
        namePl: 'Orzechowe',
        descriptors: ['Orzech laskowy', 'Migdał', 'Orzech włoski', 'Nerkowiec'],
      },
      {
        namePl: 'Prażone ziarna',
        descriptors: ['Prażony orzech', 'Tostowane zboża', 'Pieczony chleb'],
      },
    ],
  },
  {
    id: 'spices',
    namePl: 'Przyprawy 🌿',
    color: '#A85A32',
    subcategories: [
      {
        namePl: 'Korzenne',
        descriptors: ['Cynamon', 'Kardamon', 'Gałka muszkatołowa', 'Imbir', 'Goździki'],
      },
      {
        namePl: 'Wytrawne',
        descriptors: ['Czarny pieprz', 'Anyż'],
      },
    ],
  },
  {
    id: 'tea_green',
    namePl: 'Herbaciane & Ziołowe 🍵',
    color: '#2A7B62',
    subcategories: [
      {
        namePl: 'Herbaciane',
        descriptors: ['Czarna herbata', 'Zielona herbata', 'Earl Grey', 'Sencha'],
      },
      {
        namePl: 'Ziołowe',
        descriptors: ['Mięta', 'Trawa cytrynowa', 'Melisa'],
      },
    ],
  },
];
