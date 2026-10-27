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

/**
 * Wyszukuje kategorię koła smaków po identyfikatorze (odporne na wielkość liter, spacje i BOM).
 */
export function findCategoryById(id: string | undefined | null): FlavorCategory | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const cleanId = id.replace(/\uFEFF/g, '').trim().toLowerCase();
  return SCA_FLAVOR_WHEEL.find((c) => c.id.toLowerCase() === cleanId);
}

/**
 * Zwraca płaską listę unikalnych deskryptorów ze wszystkich kategorii.
 */
export function getAllDescriptors(): string[] {
  const result: string[] = [];
  for (const cat of SCA_FLAVOR_WHEEL) {
    for (const sub of cat.subcategories) {
      for (const desc of sub.descriptors) {
        if (!result.includes(desc)) {
          result.push(desc);
        }
      }
    }
  }
  return result;
}

/**
 * Odnajduje kategorię i podkategorię dla zadanego deskryptora smakowego.
 */
export function findDescriptorCategory(
  descriptor: string | undefined | null
): { category: FlavorCategory; subcategory: FlavorCategory['subcategories'][0] } | undefined {
  if (!descriptor || typeof descriptor !== 'string') return undefined;
  const clean = descriptor.replace(/\uFEFF/g, '').trim().toLowerCase();
  if (!clean) return undefined;

  for (const cat of SCA_FLAVOR_WHEEL) {
    for (const sub of cat.subcategories) {
      const match = sub.descriptors.find((d) => d.toLowerCase() === clean);
      if (match) {
        return { category: cat, subcategory: sub };
      }
    }
  }
  return undefined;
}

export interface SearchedDescriptor {
  descriptor: string;
  categoryNamePl: string;
  categoryNameEn: string;
  color: string;
}

/**
 * Filtruje deskryptory sensoryczne na podstawie zapytania tekstowego.
 */
export function searchDescriptors(query: string | undefined | null): SearchedDescriptor[] {
  if (!query || typeof query !== 'string') return [];
  const clean = query.replace(/\uFEFF/g, '').trim().toLowerCase();
  if (!clean) return [];

  const results: SearchedDescriptor[] = [];
  for (const cat of SCA_FLAVOR_WHEEL) {
    for (const sub of cat.subcategories) {
      for (const desc of sub.descriptors) {
        if (desc.toLowerCase().includes(clean)) {
          results.push({
            descriptor: desc,
            categoryNamePl: cat.namePl,
            categoryNameEn: cat.nameEn,
            color: cat.color,
          });
        }
      }
    }
  }
  return results;
}

