// ============================================================================
// Napar (Steepwise) — Hierarchiczne Koło Smaków SCA (SCA Flavor Wheel)
// Zgodne z oficjalną taksonomią Specialty Coffee Association i World Coffee Research
// ============================================================================

export interface FlavorCategory {
  id: string;
  namePl: string;
  nameEn: string;
  color: string;
  subcategories: {
    namePl: string;
    nameEn: string;
    descriptors: string[];
  }[];
}

export const SCA_FLAVOR_WHEEL: FlavorCategory[] = [
  {
    id: 'fruity',
    namePl: 'Owoce',
    nameEn: 'Fruity',
    color: '#D9534F',
    subcategories: [
      {
        namePl: 'Cytrusowe',
        nameEn: 'Citrus',
        descriptors: ['Cytryna', 'Limonka', 'Grejpfrut', 'Pomarańcza', 'Bergamotka'],
      },
      {
        namePl: 'Jagodowe',
        nameEn: 'Berry',
        descriptors: ['Jagoda', 'Jeżyna', 'Malina', 'Truskawka', 'Czarna porzeczka'],
      },
      {
        namePl: 'Pestkowe',
        nameEn: 'Stone Fruit',
        descriptors: ['Brzoskwinia', 'Morela', 'Wiśnia', 'Śliwka'],
      },
      {
        namePl: 'Tropikalne',
        nameEn: 'Tropical Fruit',
        descriptors: ['Mango', 'Marakuja', 'Ananas', 'Papaja'],
      },
      {
        namePl: 'Suszone owoce',
        nameEn: 'Dried Fruit',
        descriptors: ['Rodzynki', 'Suszona śliwka', 'Figa', 'Daktyle'],
      },
    ],
  },
  {
    id: 'sweet',
    namePl: 'Słodycz & Czekolada',
    nameEn: 'Sweet & Chocolate',
    color: '#D97736',
    subcategories: [
      {
        namePl: 'Czekolada',
        nameEn: 'Chocolate',
        descriptors: ['Ciemna czekolada', 'Mleczna czekolada', 'Kakao'],
      },
      {
        namePl: 'Karmel & Cukier',
        nameEn: 'Caramel & Sugar',
        descriptors: ['Karmel', 'Toffee', 'Cukier trzcinowy', 'Melasa', 'Miód'],
      },
      {
        namePl: 'Wanilia & Krem',
        nameEn: 'Vanilla & Cream',
        descriptors: ['Wanilia', 'Nugat', 'Masło'],
      },
    ],
  },
  {
    id: 'floral',
    namePl: 'Kwiatowe',
    nameEn: 'Floral',
    color: '#C060A8',
    subcategories: [
      {
        namePl: 'Białe kwiaty',
        nameEn: 'White Flowers',
        descriptors: ['Jaśmin', 'Kwiat pomarańczy', 'Czarny bez'],
      },
      {
        namePl: 'Aromatyczne',
        nameEn: 'Aromatic',
        descriptors: ['Róża', 'Lawenda', 'Hibiskus', 'Rumianek'],
      },
    ],
  },
  {
    id: 'nutty',
    namePl: 'Orzechy & Prażone',
    nameEn: 'Nutty & Roasted',
    color: '#8C6239',
    subcategories: [
      {
        namePl: 'Orzechowe',
        nameEn: 'Nutty',
        descriptors: ['Orzech laskowy', 'Migdał', 'Orzech włoski', 'Nerkowiec'],
      },
      {
        namePl: 'Prażone ziarna',
        nameEn: 'Roasted Grains',
        descriptors: ['Prażony orzech', 'Tostowane zboża', 'Pieczony chleb'],
      },
    ],
  },
  {
    id: 'spices',
    namePl: 'Przyprawy',
    nameEn: 'Spices',
    color: '#A85A32',
    subcategories: [
      {
        namePl: 'Korzenne',
        nameEn: 'Sweet Spice',
        descriptors: ['Cynamon', 'Kardamon', 'Gałka muszkatołowa', 'Imbir', 'Goździki'],
      },
      {
        namePl: 'Wytrawne',
        nameEn: 'Savory Spice',
        descriptors: ['Czarny pieprz', 'Anyż'],
      },
    ],
  },
  {
    id: 'tea_green',
    namePl: 'Herbaciane & Ziołowe',
    nameEn: 'Tea & Herbal',
    color: '#2A7B62',
    subcategories: [
      {
        namePl: 'Herbaciane',
        nameEn: 'Tea',
        descriptors: ['Czarna herbata', 'Zielona herbata', 'Earl Grey', 'Sencha'],
      },
      {
        namePl: 'Ziołowe',
        nameEn: 'Herbal',
        descriptors: ['Mięta', 'Trawa cytrynowa', 'Melisa'],
      },
    ],
  },
];
