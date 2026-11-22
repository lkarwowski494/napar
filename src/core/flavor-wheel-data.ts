// ============================================================================
// Napar — Hierarchiczne Koło Smaków SCA (SCA Flavor Wheel)
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
    descriptorsEn: string[];
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
        descriptorsEn: ['Lemon', 'Lime', 'Grapefruit', 'Orange', 'Bergamot'],
      },
      {
        namePl: 'Jagodowe',
        nameEn: 'Berry',
        descriptors: ['Jagoda', 'Jeżyna', 'Malina', 'Truskawka', 'Czarna porzeczka'],
        descriptorsEn: ['Blueberry', 'Blackberry', 'Raspberry', 'Strawberry', 'Blackcurrant'],
      },
      {
        namePl: 'Pestkowe',
        nameEn: 'Stone Fruit',
        descriptors: ['Brzoskwinia', 'Morela', 'Wiśnia', 'Śliwka'],
        descriptorsEn: ['Peach', 'Apricot', 'Cherry', 'Plum'],
      },
      {
        namePl: 'Tropikalne',
        nameEn: 'Tropical Fruit',
        descriptors: ['Mango', 'Marakuja', 'Ananas', 'Papaja'],
        descriptorsEn: ['Mango', 'Passion Fruit', 'Pineapple', 'Papaya'],
      },
      {
        namePl: 'Suszone owoce',
        nameEn: 'Dried Fruit',
        descriptors: ['Rodzynki', 'Suszona śliwka', 'Figa', 'Daktyle'],
        descriptorsEn: ['Raisin', 'Prune', 'Fig', 'Date'],
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
        descriptorsEn: ['Dark Chocolate', 'Milk Chocolate', 'Cocoa'],
      },
      {
        namePl: 'Karmel & Cukier',
        nameEn: 'Caramel & Sugar',
        descriptors: ['Karmel', 'Toffee', 'Cukier trzcinowy', 'Melasa', 'Miód'],
        descriptorsEn: ['Caramel', 'Toffee', 'Cane Sugar', 'Molasses', 'Honey'],
      },
      {
        namePl: 'Wanilia & Krem',
        nameEn: 'Vanilla & Cream',
        descriptors: ['Wanilia', 'Nugat', 'Masło'],
        descriptorsEn: ['Vanilla', 'Nougat', 'Butter'],
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
        descriptorsEn: ['Jasmine', 'Orange Blossom', 'Elderflower'],
      },
      {
        namePl: 'Aromatyczne',
        nameEn: 'Aromatic',
        descriptors: ['Róża', 'Lawenda', 'Hibiskus', 'Rumianek'],
        descriptorsEn: ['Rose', 'Lavender', 'Hibiscus', 'Chamomile'],
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
        descriptorsEn: ['Hazelnut', 'Almond', 'Walnut', 'Cashew'],
      },
      {
        namePl: 'Prażone ziarna',
        nameEn: 'Roasted Grains',
        descriptors: ['Prażony orzech', 'Tostowane zboża', 'Pieczony chleb'],
        descriptorsEn: ['Roasted Nut', 'Toasted Grain', 'Baked Bread'],
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
        descriptorsEn: ['Cinnamon', 'Cardamom', 'Nutmeg', 'Ginger', 'Clove'],
      },
      {
        namePl: 'Wytrawne',
        nameEn: 'Savory Spice',
        descriptors: ['Czarny pieprz', 'Anyż'],
        descriptorsEn: ['Black Pepper', 'Anise'],
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
        descriptorsEn: ['Black Tea', 'Green Tea', 'Earl Grey', 'Sencha'],
      },
      {
        namePl: 'Ziołowe',
        nameEn: 'Herbal',
        descriptors: ['Mięta', 'Trawa cytrynowa', 'Melisa'],
        descriptorsEn: ['Mint', 'Lemongrass', 'Lemon Balm'],
      },
    ],
  },
];

const PL_TO_EN_DESCRIPTOR: Record<string, string> = {};
for (const cat of SCA_FLAVOR_WHEEL) {
  for (const sub of cat.subcategories) {
    sub.descriptors.forEach((pl, i) => {
      PL_TO_EN_DESCRIPTOR[pl] = sub.descriptorsEn[i];
    });
  }
}

export function localizeFlavorDescriptor(descriptor: string, language: 'pl' | 'en'): string {
  if (language === 'en') {
    return PL_TO_EN_DESCRIPTOR[descriptor] ?? descriptor;
  }
  return descriptor;
}

