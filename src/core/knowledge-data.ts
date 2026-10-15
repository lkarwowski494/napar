// ============================================================================
// Napar (Steepwise) — Knowledge Base / Kompendium Terroir, Odmian i Tradycji
// (BR-WIEDZA-001 & BR-WIEDZA-002)
// Specialty Coffee Varieties, Processing, Origins & Artisan Tea Classification
// ============================================================================

export interface CoffeeVarietyInfo {
  id: string;
  name: string;
  nativeRegion: string;
  geneticLineage: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  cupCharacteristics: {
    acidity: 'Niska' | 'Średnia' | 'Wysoka' | 'Wybitna / Cytrusowa' | 'Fosforowa / Soczysta';
    body: 'Lekkie / Herbaciane' | 'Średnie / Jedwabiste' | 'Pełne / Kremowe' | 'Syropowate';
    sweetness: 'Wysoka' | 'Bardzo wysoka' | 'Zbalansowana' | 'Cukierkowa / Miodowa';
  };
  keyNotesPl: string[];
  keyNotesEn: string[];
  recommendedRoast: 'Jasne (Filter)' | 'Jasne / Omniroast' | 'Średnie (Espresso)';
  descriptionPl: string;
  descriptionEn: string;
}

export interface CoffeeProcessInfo {
  id: string;
  name: string;
  processType: 'WASHED' | 'NATURAL' | 'HONEY' | 'ANAEROBIC' | 'CARBONIC_MACERATION' | 'WET_HULLED';
  sensoryImpactPl: string;
  sensoryImpactEn: string;
  dryingDurationDays: string;
  waterConsumption: 'Wysokie' | 'Umiarkowane' | 'Zerowe' | 'Brak (maceracja w tanku)';
  keyNotesPl: string[];
  keyNotesEn: string[];
  descriptionPl: string;
  descriptionEn: string;
}

export interface CoffeeOriginInfo {
  id: string;
  country: string;
  countryCode: string;
  primaryRegions: string[];
  typicalAltitudeMeters: string;
  harvestMonths: string;
  mainVarieties: string[];
  flavorProfilePl: string;
  flavorProfileEn: string;
  keyNotesPl: string[];
  descriptionPl: string;
  descriptionEn: string;
}

export interface TeaCategoryInfo {
  id: string;
  namePl: string;
  nameEn: string;
  traditionalName: string;
  oxidationRangePercent: string;
  killGreenMethod: string;
  waterTemperatureCelsius: number;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  famousVarietiesPl: string[];
  famousRegions: string[];
  healthAttributesPl: string;
  descriptionPl: string;
  descriptionEn: string;
}

// ----------------------------------------------------------------------------
// 1. Odmiany Botaniczne Kawy (10 wzorcowych odmian)
// ----------------------------------------------------------------------------
export const COFFEE_VARIETIES: CoffeeVarietyInfo[] = [
  {
    id: 'variety-geisha',
    name: 'Geisha (Gesha)',
    nativeRegion: 'Gori Gesha (Etiopia) / Boquete (Panama)',
    geneticLineage: 'Dzikie populacje endemiczne z lasu Gori Gesha',
    sensoryProfilePl: 'Krystaliczna czystość, herbaciane i zwiewne ciało, intensywny aromat jaśminu, bergamotki, białej brzoskwini i kwiatu pomarańczy.',
    sensoryProfileEn: 'Crystal clarity, tea-like delicate body, explosive jasmine floral aroma, bergamot, white peach, and orange blossom.',
    cupCharacteristics: {
      acidity: 'Wybitna / Cytrusowa',
      body: 'Lekkie / Herbaciane',
      sweetness: 'Bardzo wysoka',
    },
    keyNotesPl: ['jaśmin', 'bergamotka', 'biała brzoskwinia', 'kwiat pomarańczy', 'czarna herbata'],
    keyNotesEn: ['jasmine', 'bergamot', 'white peach', 'orange blossom', 'black tea'],
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: 'Najbardziej ceniona i wielokrotnie nagradzana odmiana w świecie specialty. Odkryta w Etiopii w latach 30., zyskała legendarny status po aukcji Best of Panama 2004 na farmie Hacienda La Esmeralda.',
    descriptionEn: 'The most prestigious and highly priced variety in specialty coffee history. Brought from Ethiopia in the 1930s, it achieved legendary status during the 2004 Best of Panama auction by Hacienda La Esmeralda.',
  },
  {
    id: 'variety-sl28-sl34',
    name: 'SL28 & SL34',
    nativeRegion: 'Scott Agricultural Laboratories (Kenia)',
    geneticLineage: 'Selekcja szczepów Bourbon / Tanganyika drought-resistant z lat 1935–1939',
    sensoryProfilePl: 'Znak rozpoznawczy afrykańskich filtrów: soczysta, fosforowa kwasowość, nuty czarnej porzeczki, rabarbaru, jeżyn i wina musującego.',
    sensoryProfileEn: 'The hallmark of Kenyan specialty coffee: crisp phosphoric acidity, intense blackcurrant, rhubarb, blackberry, and sparkling wine tones.',
    cupCharacteristics: {
      acidity: 'Fosforowa / Soczysta',
      body: 'Średnie / Jedwabiste',
      sweetness: 'Wysoka',
    },
    keyNotesPl: ['czarna porzeczka', 'rabarbar', 'jeżyna', 'czerwona porzeczka', 'czerwony grejpfrut'],
    keyNotesEn: ['blackcurrant', 'rhubarb', 'blackberry', 'redcurrant', 'ruby grapefruit'],
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: 'Odmiany wyhodowane w Scott Laboratories w Kenii. Wyjątkowo odporne na suszę, słyną z unikalnej obecności kwasu fosforowego wzmacniającego soczystość owocową.',
    descriptionEn: 'Bred in Kenya during the 1930s by Scott Agricultural Laboratories. Renowned for drought tolerance and an unmistakable phosphoric acidity that creates a sparkling mouthfeel.',
  },
  {
    id: 'variety-pink-bourbon',
    name: 'Pink Bourbon (Różowy Bourbon)',
    nativeRegion: 'Huila (Kolumbia)',
    geneticLineage: 'Naturalna hybryda szczepów etiopskich landraces zidentyfikowana w San Adolfo',
    sensoryProfilePl: 'Rzadka odmiana o dojrzałych różowo-łososiowych owocach. Niezwykle słodka, łącząca nuty różowego grejpfruta, papai, marakui i miodu z kremową konsystencją.',
    sensoryProfileEn: 'Rare variety yielding salmon-pink cherries. Exceptionally sweet, showcasing pink grapefruit, papaya, passion fruit, and honey blossom with a silky texture.',
    cupCharacteristics: {
      acidity: 'Wybitna / Cytrusowa',
      body: 'Średnie / Jedwabiste',
      sweetness: 'Cukierkowa / Miodowa',
    },
    keyNotesPl: ['różowy grejpfrut', 'papaja', 'kwiat jaśminu', 'marakuja', 'miód akacjowy'],
    keyNotesEn: ['pink grapefruit', 'papaya', 'jasmine flower', 'passion fruit', 'acacia honey'],
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: 'Początkowo uważany za krzyżówkę Red i Yellow Bourbon, badania DNA wykazały pokrewieństwo z odmianami etiopskimi. Dojrzałe owoce mają unikalny różowy kolor.',
    descriptionEn: 'Initially thought to be a cross of Red and Yellow Bourbon, recent DNA sequencing traced its roots to Ethiopian landraces. Ripe cherries bear a distinctive rose-pink hue.',
  },
  {
    id: 'variety-ethiopian-landraces',
    name: 'Ethiopian Heirloom / Landraces',
    nativeRegion: 'Yirgacheffe, Guji, Sidama (Etiopia)',
    geneticLineage: 'Dziko rosnące odmiany endemiczne pierwotnych lasów deszczowych Etiopii',
    sensoryProfilePl: 'Wielowymiarowa eksplozja kwiatowa i cytrusowa. Bergamotka, kwiat lipy, trawa cytrynowa, słodka morela i czysta czarna herbata.',
    sensoryProfileEn: 'Multidimensional floral and citrus explosion. Bergamot, linden flower, lemongrass, sweet apricot, and crisp black tea.',
    cupCharacteristics: {
      acidity: 'Wybitna / Cytrusowa',
      body: 'Lekkie / Herbaciane',
      sweetness: 'Wysoka',
    },
    keyNotesPl: ['bergamotka', 'herbata Earl Grey', 'trawa cytrynowa', 'morela', 'kwiat lipy'],
    keyNotesEn: ['bergamot', 'Earl Grey tea', 'lemongrass', 'apricot', 'linden blossom'],
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: 'W Etiopii rosną tysiące nienazwanych odmian botanicznych (szacuje się od 6 000 do 10 000 szczepów). Nazwy selekcji regionalnych to m.in. Kurume, Dega, Wolisho czy Bedessa.',
    descriptionEn: 'Ethiopia is the birthplace of Arabica coffee, harboring an estimated 6,000 to 10,000 wild indigenous cultivars referred to collectively as Ethiopian Landraces or Heirloom.',
  },
  {
    id: 'variety-bourbon',
    name: 'Bourbon (Red, Yellow, Orange)',
    nativeRegion: 'Wyspa Reunion (dawniej Île Bourbon)',
    geneticLineage: 'Naturalna mutacja Typiki wyselekcjonowana przez francuskich misjonarzy',
    sensoryProfilePl: 'Archetyp słodkiej i zbalansowanej kawy: gęsty karmel, mleczna czekolada, czerwone jabłko i zrównoważona kwasowość kwasu jabłkowego.',
    sensoryProfileEn: 'The archetype of sweet, balanced coffee: rich caramel, milk chocolate, crisp red apple, and balanced malic acidity.',
    cupCharacteristics: {
      acidity: 'Średnia',
      body: 'Pełne / Kremowe',
      sweetness: 'Bardzo wysoka',
    },
    keyNotesPl: ['mleczna czekolada', 'karmel', 'czerwone jabłko', 'wanilia', 'orzech laskowy'],
    keyNotesEn: ['milk chocolate', 'caramel', 'red apple', 'vanilla', 'hazelnut'],
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: 'Jedna z najważniejszych historycznie odmian Arabiki. Rozprzestrzeniona w Ameryce Łacińskiej i Afryce, ceniona za wyśmienitą słodycz i doskonałe ciało.',
    descriptionEn: 'One of the foundational Arabica varieties. Spread across the Americas and Africa, cherished for its rich natural sweetness and well-rounded body.',
  },
  {
    id: 'variety-typica',
    name: 'Typica',
    nativeRegion: 'Jemen / Ameryka Łacińska',
    geneticLineage: 'Prapoczątek większości współczesnych odmian Arabiki (Coffea arabica var. typica)',
    sensoryProfilePl: 'Arystokratyczna elegancja w filiżance. Czysty, aksamitny napar o nutach kwiatów cytryny, słodkiego kakao, melasy i świeżej gruszki.',
    sensoryProfileEn: 'Aristocratic cup elegance. Clean, velvety brew highlighting lemon blossoms, sweet cocoa, molasses, and fresh pear.',
    cupCharacteristics: {
      acidity: 'Średnia',
      body: 'Średnie / Jedwabiste',
      sweetness: 'Zbalansowana',
    },
    keyNotesPl: ['kwiat cytryny', 'słodkie kakao', 'melasa', 'orzech włoski', 'gruszka'],
    keyNotesEn: ['lemon blossom', 'sweet cocoa', 'molasses', 'walnut', 'pear'],
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: 'Pierwsza odmiana kawy wywieziona z Jemenu do Indii i Indonezji, a stamtąd do Europy i obu Ameryk. Charakteryzuje się stożkowym pokrojem krzewu i brązowymi młodymi liśćmi.',
    descriptionEn: 'The original variety exported from Yemen to India, Indonesia, and across the globe. Features tall conical trees with bronze-tipped young leaves.',
  },
  {
    id: 'variety-caturra-catuai',
    name: 'Caturra & Catuai',
    nativeRegion: 'Brazylia / Kostaryka',
    geneticLineage: 'Caturra: karłowata mutacja Bourbona; Catuai: krzyżówka Caturra x Mundo Novo',
    sensoryProfilePl: 'Kompaktowe krzewy dające czysty profil o żywej kwasowości cytrusowej, nutach migdałów, czekolady deserowej i miodu trzcinowego.',
    sensoryProfileEn: 'Compact dwarf cultivars producing clean cup profiles with lively citrus notes, toasted almonds, dark chocolate, and cane sugar sweetness.',
    cupCharacteristics: {
      acidity: 'Średnia',
      body: 'Średnie / Jedwabiste',
      sweetness: 'Zbalansowana',
    },
    keyNotesPl: ['migdały', 'cytryna', 'miód trzcinowy', 'kakao', 'jabłko'],
    keyNotesEn: ['almonds', 'lemon', 'cane sugar', 'cocoa', 'apple'],
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: 'Odmiany o niższym wzroście, umożliwiające gęstsze nasadzenia i łatwiejszy zbiór ręczny na stromych zboczach Ameryki Środkowej. Znakomity standard specialty.',
    descriptionEn: 'Semi-dwarf cultivars developed in Brazil allowing high-density planting. Highly popular across Central America for their solid yields and reliable cup quality.',
  },
  {
    id: 'variety-pacamara-maragogype',
    name: 'Pacamara & Maragogype',
    nativeRegion: 'Salwador / Brazylia',
    geneticLineage: 'Maragogype: olbrzymia mutacja Typiki; Pacamara: krzyżówka Pacas x Maragogype',
    sensoryProfilePl: 'Wielkie ziarna (Elephant Beans) dające gęste, syropowate body, pikantne nuty ziół, tytoniu, marakui i czekolady deserowej.',
    sensoryProfileEn: 'Giant elephant beans yielding syrupy, heavy body, exotic spices, sweet pipe tobacco, passion fruit, and rich dark chocolate.',
    cupCharacteristics: {
      acidity: 'Średnia',
      body: 'Syropowate',
      sweetness: 'Wysoka',
    },
    keyNotesPl: ['marakuja', 'czekolada deserowa', 'tytoń', 'cedr', 'kardamon'],
    keyNotesEn: ['passion fruit', 'dark chocolate', 'sweet tobacco', 'cedar', 'cardamom'],
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: 'Odmiana Pacamara wyhodowana w Salwadorze (ISIC) w wyniku 30 lat badań. Ceniona za niezwykłą złożoność sensoryczną i rozmiar sita (Screen 19+).',
    descriptionEn: 'Pacamara was bred in El Salvador after 30 years of scientific research. Cherished by brewers for its massive bean size and deeply complex, savory-sweet flavor spectrum.',
  },
  {
    id: 'variety-castillo-colombia',
    name: 'Castillo & Colombia',
    nativeRegion: 'Cenicafé (Kolumbia)',
    geneticLineage: 'Hybryda Caturra x Híbrido de Timor (odporność na rdzę liściową Roya)',
    sensoryProfilePl: 'Filary kolumbijskiego rolnictwa specialty. Zbalansowany napar o nutach czerwonych owoców, karmelu, cytrusów i mlecznej czekolady.',
    sensoryProfileEn: 'The pillars of modern Colombian coffee farming. Balanced cup with red fruit nuances, panela caramel, citrus, and smooth milk chocolate.',
    cupCharacteristics: {
      acidity: 'Średnia',
      body: 'Pełne / Kremowe',
      sweetness: 'Zbalansowana',
    },
    keyNotesPl: ['wiśnia', 'karmel', 'pomarańcza', 'czekolada mleczna', 'panela'],
    keyNotesEn: ['cherry', 'caramel', 'orange', 'milk chocolate', 'panela'],
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: 'Opracowane przez instytut Cenicafé w celu ochrony farmerów przed niszczycielską rdzą kawową (Hemileia vastatrix), przy jednoczesnym zachowaniu standardów jakości specialty.',
    descriptionEn: 'Engineered by Cenicafé to resist devastating coffee leaf rust (roya) while preserving excellent sensory scores under specialty farming conditions.',
  },
  {
    id: 'variety-eugenioides',
    name: 'Coffea Eugenioides',
    nativeRegion: 'Góry Afryki Wschodniej (Kenia, Uganda, Rwanda)',
    geneticLineage: 'Dziki rodzic botaniczny Coffea Arabica (Arabica = Eugenioides x Canephora)',
    sensoryProfilePl: 'Unikat światowy o znikomej goryczy i niskiej zawartości kofeiny (ok. 0.2%). Szokująca naturalna słodycz pieczonych pianek marshmallows, sezamu, mleka i papai.',
    sensoryProfileEn: 'Extremely rare species with nearly zero bitterness and low caffeine (~0.2%). Incredible natural sweetness of toasted marshmallows, sesame candy, and tropical papaya.',
    cupCharacteristics: {
      acidity: 'Niska',
      body: 'Lekkie / Herbaciane',
      sweetness: 'Cukierkowa / Miodowa',
    },
    keyNotesPl: ['pianki marshmallow', 'prażony sezam', 'papaja', 'mleczna słodycz', 'guawa'],
    keyNotesEn: ['marshmallow', 'toasted sesame', 'papaya', 'milky sweetness', 'guava'],
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: 'Gatunek botaniczny, który dał początek Arabice w wyniku naturalnego skrzyżowania z Robustą (Canephora). Używany przez mistrzów świata (WBC) do tworzenia zaskakujących profili smakowych.',
    descriptionEn: 'The diploid maternal parent species of Coffea Arabica. Celebrated by World Barista Champions for its astonishing candy-sweet profile devoid of chlorogenic acid bitterness.',
  },
];

// ----------------------------------------------------------------------------
// 2. Metody Obróbki Kawy (6 metod rzemieślniczych)
// ----------------------------------------------------------------------------
export const COFFEE_PROCESSES: CoffeeProcessInfo[] = [
  {
    id: 'process-washed',
    name: 'Washed (Mokra / Myta)',
    processType: 'WASHED',
    dryingDurationDays: '8–14 dni na stołach afrykańskich',
    waterConsumption: 'Wysokie',
    sensoryImpactPl: 'Maksymalna przejrzystość i klarowność terroir. Owoce są depulpowane natychmiast po zbiorze, a resztki miąższu usuwane w fermentacji wodnej. Uwypukla kwasowość owocową i nuty kwiatowe.',
    sensoryImpactEn: 'Maximum terroir clarity and crispness. Fruit is pulped immediately and fermented in water tanks. Amplifies floral aromatics and sparkling fruit acidity.',
    keyNotesPl: ['czystość', 'wysoka kwasowość', 'jaśmin', 'cytrusy', 'zielona herbata'],
    keyNotesEn: ['cleanliness', 'crisp acidity', 'jasmine', 'citrus', 'green tea'],
    descriptionPl: 'Klasyczna metoda obróbki powstała w XIX wieku w Ameryce Środkowej. Umożliwia precyzyjną ocenę jakości ziaren bez posmaków wynikających z fermentacji suszącego się miąższu.',
    descriptionEn: 'The traditional wet process originating in the 19th century. Removes the fruit flesh before drying, spotlighting the pure genetic and soil characteristics of the bean.',
  },
  {
    id: 'process-natural',
    name: 'Natural (Sucha / Tradycyjna)',
    processType: 'NATURAL',
    dryingDurationDays: '18–30 dni suszenia w całości',
    waterConsumption: 'Zerowe',
    sensoryImpactPl: 'Owoce kawowca suszone są w całości ze skórką i miąższem. Cukry z owocu przenikają do ziarna, dając ciężkie body, intensywne nuty dojrzałych truskawek, borówek, likieru i czekolady.',
    sensoryImpactEn: 'Whole cherries dried under the sun with skin and pulp intact. Sugars migrate into the seed, producing heavy body, ripe strawberries, blueberries, and wine-like liqueur.',
    keyNotesPl: ['truskawka', 'borówka', 'dżem owocowy', 'likier', 'gęste body'],
    keyNotesEn: ['strawberry', 'blueberry', 'fruit jam', 'liqueur', 'heavy body'],
    descriptionPl: 'Najstarsza historycznie metoda obróbki, charakterystyczna dla suchych regionów Etiopii (Harrar, Guji) i plantacji w Brazylii. Wymaga nieustannego grabienia ziaren na łożach, by uniknąć pleśni.',
    descriptionEn: 'The oldest processing method, native to arid regions of Ethiopia and vast Brazilian plateaus. Requires vigilant turning on raised drying beds to prevent over-fermentation.',
  },
  {
    id: 'process-honey',
    name: 'Honey (Yellow, Red, Black Honey)',
    processType: 'HONEY',
    dryingDurationDays: '12–25 dni w zależności od grubości śluzu',
    waterConsumption: 'Umiarkowane',
    sensoryImpactPl: 'Skórka jest usuwana, ale część lepkiego miąższu (mucilage) pozostaje na ziarnie. Zależnie od ilości pozostawionego śluzu wyróżnia się Yellow (25%), Red (50%) i Black Honey (100%). Łączy czystość Washed ze słodyczą Naturala.',
    sensoryImpactEn: 'Pulp is stripped while sticky mucilage remains during drying. Graded as Yellow (25%), Red (50%), or Black Honey (100%). Blends washed clarity with natural sweetness.',
    keyNotesPl: ['miód', 'brzoskwinia', 'żółta śliwka', 'karmel', 'aksamitny finisz'],
    keyNotesEn: ['honey', 'peach', 'yellow plum', 'caramel', 'silky finish'],
    descriptionPl: 'Pionierami metody Honey byli farmerzy z Kostaryki po trzęsieniu ziemi w 2008 roku, które odcięło dostęp do wody. Stała się znakiem rozpoznawczym innowacji mikromłynów w Ameryce Środkowej.',
    descriptionEn: 'Pioneered in Costa Rica after the 2008 earthquake limited water infrastructure. Today, honey processing defines Central American micro-mill craftsmanship.',
  },
  {
    id: 'process-anaerobic',
    name: 'Anaerobic (Beztlenowa w tankach)',
    processType: 'ANAEROBIC',
    dryingDurationDays: '48–120h w tanku + 15–20 dni suszenia',
    waterConsumption: 'Brak (maceracja w tanku)',
    sensoryImpactPl: 'Kontrolowana fermentacja w szczelnie zamkniętych tankach ze stali nierdzewnej z zaworem odprowadzającym tlen i CO2. Pozwala na rozwój specyficznych szczepów drożdży i bakterii kwasu mlekowego, dając nuty cynamonu, jogurtu, ananasa i gumy balonowej.',
    sensoryImpactEn: 'Oxygen-deprived fermentation in sealed stainless tanks with one-way release valves. Promotes lactic bacteria and wild yeasts, yielding cinnamon, Greek yogurt, and tropical punch.',
    keyNotesPl: ['cynamon', 'jogurt grecki', 'ananas', 'marakuja', 'guma balonowa'],
    keyNotesEn: ['cinnamon', 'greek yogurt', 'pineapple', 'passion fruit', 'bubblegum'],
    descriptionPl: 'Nowoczesny trend fermentacji precyzyjnej w specialty. Kontrola temperatury i poziomu pH w zamkniętym naczyniu pozwala na powtarzalne uzyskiwanie egzotycznych, wielowarstwowych nut smakowych.',
    descriptionEn: 'Modern precision biotechnology applied to specialty coffee. Monitoring tank temperature, Brix sugars, and pH produces repeatable, exotic flavor profiles.',
  },
  {
    id: 'process-carbonic-maceration',
    name: 'Carbonic Maceration (Maceracja Węglowa)',
    processType: 'CARBONIC_MACERATION',
    dryingDurationDays: '60–100h w CO2 + 20 dni suszenia',
    waterConsumption: 'Brak (maceracja w tanku)',
    sensoryImpactPl: 'Technika zaadaptowana ze świata winiarskiego (Beaujolais) przez Mistrza Świata Baristów Sasę Sestica. Całe owoce umieszczane są w zbiorniku przesyconym dwutlenkiem węgla, inicjując fermentację wewnątrz pojedynczych nienaruszonych owoców. Daje profil kandyzowanych wiśni, malin i wina musującego.',
    sensoryImpactEn: 'Wine-making technique brought to coffee by WBC Champion Sasa Sestic. Cherries ferment intracellularly in pressurized carbon dioxide tanks, unlocking candied cherries and sparkling wine.',
    keyNotesPl: ['kandyzowana wiśnia', 'malina', 'wino musujące', 'czerwona porzeczka'],
    keyNotesEn: ['candied cherry', 'raspberry', 'sparkling wine', 'redcurrant'],
    descriptionPl: 'Proces zyskał sławę na mistrzostwach świata w Seattle (2015). Rozbicie pektyn zachodzi od wewnątrz nasiona bez dostępu tlenu, dając spektakularną czystość i unikalną strukturę kwasowości.',
    descriptionEn: 'Rose to worldwide acclaim during the 2015 World Barista Championship. Intracellular enzymatic breakdown yields singular candied fruit and wine aromas.',
  },
  {
    id: 'process-wet-hulled',
    name: 'Wet-Hulled (Giling Basah - Sumatra)',
    processType: 'WET_HULLED',
    dryingDurationDays: 'Szybkie łuskanie przy wilgotności 30–35%',
    waterConsumption: 'Wysokie',
    sensoryImpactPl: 'Tradycyjna metoda z wysp Indonezji (Sumatra, Sulawesi) wymuszona wysoką wilgotnością tropikalną. Pergamin jest usuwany, gdy ziarno jest jeszcze miękkie i wilgotne. Tworzy charakterystyczny ciemnozielony kolor ziarna, bardzo niską kwasowość, nuty cedru, tytoniu, ziół leśnych i ziemistą słodycz.',
    sensoryImpactEn: 'Unique Indonesian method driven by tropical humidity. Beans are hulled while still soft at 30-35% moisture, creating blue-green seeds, low acidity, cedarwood, and earthy sweetness.',
    keyNotesPl: ['cedr', 'tytoń', 'leśne zioła', 'ciemna czekolada', 'bardzo niska kwasowość'],
    keyNotesEn: ['cedarwood', 'pipe tobacco', 'forest herbs', 'dark chocolate', 'very low acidity'],
    descriptionPl: 'Specjalność wysp indonezyjskich. Wilgotny klimat uniemożliwia powolne tradycyjne suszenie, stąd łuskanie półmokrego ziarna przed ostatecznym dosuszeniem na słońcu.',
    descriptionEn: 'Signature method of Sumatra and Sulawesi. The tropical rainfall necessitates hulling at high moisture content, giving Sumatran coffees their legendary heavy syrupy body.',
  },
];

// ----------------------------------------------------------------------------
// 3. Regiony i Terroir Kawowe (7 najważniejszych krajów pochodzenia)
// ----------------------------------------------------------------------------
export const COFFEE_ORIGINS: CoffeeOriginInfo[] = [
  {
    id: 'origin-ethiopia',
    country: 'Etiopia',
    countryCode: 'ET',
    primaryRegions: ['Yirgacheffe', 'Guji', 'Sidama', 'Harrar', 'Jimma'],
    typicalAltitudeMeters: '1800 – 2200 m n.p.m.',
    harvestMonths: 'Listopad – Luty',
    mainVarieties: ['Kurume', 'Dega', 'Wolisho', 'Heirloom Landraces'],
    flavorProfilePl: 'Światowa stolica aromatu kwiatowego: jaśmin, herbata Earl Grey, bergamotka, soczyste owoce cytrusowe i morele.',
    flavorProfileEn: 'The global capital of floral complexity: jasmine, Earl Grey tea, bergamot, lively citrus, and sun-ripened apricots.',
    keyNotesPl: ['jaśmin', 'bergamotka', 'Earl Grey', 'morela', 'brzoskwinia'],
    descriptionPl: 'Kolebka kawy Arabica. Uprawiana głównie w zacienionych ogrodach leśnych (Garden Coffee) przez setki tysięcy drobnych rolników zrzeszonych w spółdzielniach.',
    descriptionEn: 'The birthplace of coffee. Grown mostly in shaded smallholder gardens under canopy trees at breathtaking high altitudes.',
  },
  {
    id: 'origin-kenya',
    country: 'Kenia',
    countryCode: 'KE',
    primaryRegions: ['Nyeri', 'Kirinyaga', 'Murang’a', 'Kiambu', 'Embu'],
    typicalAltitudeMeters: '1600 – 2100 m n.p.m.',
    harvestMonths: 'Październik – Grudzień (główny), Czerwiec – Lipiec (fly crop)',
    mainVarieties: ['SL28', 'SL34', 'Ruiru 11', 'Batian'],
    flavorProfilePl: 'Niezrównana kwasowość kwasu fosforowego, intensywna czarna porzeczka, rabarbar, owoce leśne i soczysty finisz.',
    flavorProfileEn: 'Unrivalled sparkling phosphoric acidity, intense blackcurrant, tart rhubarb, forest berries, and sweet savory juiciness.',
    keyNotesPl: ['czarna porzeczka', 'rabarbar', 'jeżyna', 'śliwka', 'czerwony grejpfrut'],
    descriptionPl: 'Żyzne czerwone gleby wulkaniczne wokół Mount Kenya oraz rygorystyczny system stacji mycia (wet mills/factories) tworzą jedne z najczystszych i najbardziej wyrazistych kaw świata.',
    descriptionEn: 'Red volcanic soils around Mount Kenya and rigorous wet-mill sorting at cooperative factories produce some of the most vibrant coffees on Earth.',
  },
  {
    id: 'origin-colombia',
    country: 'Kolumbia',
    countryCode: 'CO',
    primaryRegions: ['Huila', 'Nariño', 'Antioquia', 'Tolima', 'Cauca'],
    typicalAltitudeMeters: '1400 – 2100 m n.p.m.',
    harvestMonths: 'Zbiory przez cały rok dzięki zróżnicowanym mikroklimatom andyjskim',
    mainVarieties: ['Castillo', 'Caturra', 'Pink Bourbon', 'Colombia', 'Geisha'],
    flavorProfilePl: 'Czysta słodycz trzcinowa (panela), czerwone jabłko, karmel, cytrusy i jedwabiste, zbalansowane body.',
    flavorProfileEn: 'Pure cane sugar sweetness (panela), crisp red apple, caramel, citrus zest, and silky balanced body.',
    keyNotesPl: ['panela', 'czerwone jabłko', 'karmel', 'pomarańcza', 'mleczna czekolada'],
    descriptionPl: 'Trzeci producent kawy na świecie i lider jakości specialty. Zróżnicowane łańcuchy Andów pozwalają na zbiory świeżej kawy w różnych regionach przez 12 miesięcy w roku.',
    descriptionEn: 'A global powerhouse of specialty coffee. Three cordilleras of the Andes create distinct microclimates, enabling fresh harvest year-round.',
  },
  {
    id: 'origin-guatemala',
    country: 'Gwatemala',
    countryCode: 'GT',
    primaryRegions: ['Antigua', 'Huehuetenango', 'Cobán', 'Fraijanes', 'Atitlán'],
    typicalAltitudeMeters: '1500 – 2000 m n.p.m.',
    harvestMonths: 'Grudzień – Kwiecień',
    mainVarieties: ['Bourbon', 'Caturra', 'Typica', 'Maragogype', 'Pacamara'],
    flavorProfilePl: 'Wpływ żyznych popiołów wulkanicznych: bogata czekolada deserowa, kakao, nuty korzenne, jabłkowa kwasowość i gęste body.',
    flavorProfileEn: 'Rich volcanic soil influence: dark chocolate, baker cocoa, warm spices, crisp malic acidity, and syrupy body.',
    keyNotesPl: ['czekolada deserowa', 'kakao', 'cynamon', 'jabłko', 'orzech laskowy'],
    descriptionPl: 'Kraj wulkanów i mikroklimatów. W regionie Huehuetenango suche, gorące wiatry z Meksyku chronią uprawy przed przymrozkami na wysokościach sięgających 2000 m n.p.m.',
    descriptionEn: 'Land of volcanoes and microclimates. In Huehuetenango, warm winds from Mexican plains protect highland coffee farms from frost up to 2,000m.',
  },
  {
    id: 'origin-costa-rica',
    country: 'Kostaryka',
    countryCode: 'CR',
    primaryRegions: ['Tarrazú', 'West Valley', 'Central Valley', 'Brunca'],
    typicalAltitudeMeters: '1200 – 1900 m n.p.m.',
    harvestMonths: 'Grudzień – Marzec',
    mainVarieties: ['Caturra', 'Catuai', 'Villa Sarchi', 'SL28', 'Geisha'],
    flavorProfilePl: 'Światowy lider innowacji honey/anaerobic. Niezwykle słodki profil miodowy, żółte owoce, morele i maślany finisz.',
    flavorProfileEn: 'Pioneers of honey and experimental anaerobic fermentations. Intensely sweet honeyed cup, apricot, yellow stone fruits, and buttered finish.',
    keyNotesPl: ['miód', 'morela', 'żółta brzoskwinia', 'wanilia', 'karmel'],
    descriptionPl: 'Kraj o najwyższych standardach ekologicznych i technicznych. Uprawa Robusty była tu prawnie zakazana przez dziesięciolecia, by chronić reputację kostarykańskiej Arabiki.',
    descriptionEn: 'World-renowned for ecological sustainability and micro-mill processing innovation. Robusta cultivation was banned for decades to protect Arabica pedigree.',
  },
  {
    id: 'origin-brazil',
    country: 'Brazylia',
    countryCode: 'BR',
    primaryRegions: ['Sul de Minas', 'Cerrado Mineiro', 'Mogiana', 'Espírito Santo'],
    typicalAltitudeMeters: '800 – 1350 m n.p.m.',
    harvestMonths: 'Maj – Wrzesień',
    mainVarieties: ['Yellow Bourbon', 'Mundo Novo', 'Catucai', 'Catuai'],
    flavorProfilePl: 'Fundament słodyczy i kremowego espresso. Niska kwasowość, orzechy laskowe, migdały, mleczna czekolada i suszone owoce.',
    flavorProfileEn: 'The cornerstone of sweet, chocolatey espresso blends. Mild acidity, toasted hazelnuts, milk chocolate, and sun-dried fruit sweetness.',
    keyNotesPl: ['orzech laskowy', 'mleczna czekolada', 'migdały', 'karmel', 'suszona śliwka'],
    descriptionPl: 'Największy producent kawy na świecie od ponad 150 lat. Oprócz wielkich farm zmechanizowanych, regiony Sul de Minas i Cerrado produkują wybitne Yellow Bourbony o rzemieślniczym charakterze.',
    descriptionEn: 'The world’s largest coffee producer for over 150 years. Alongside vast mechanized estates, mountainous micro-regions craft exceptional specialty lots.',
  },
  {
    id: 'origin-panama',
    country: 'Panama',
    countryCode: 'PA',
    primaryRegions: ['Boquete', 'Volcán', 'Renacimiento'],
    typicalAltitudeMeters: '1400 – 2000 m n.p.m.',
    harvestMonths: 'Grudzień – Marzec',
    mainVarieties: ['Geisha (Gesha)', 'Typica', 'Pacamara', 'Catuai'],
    flavorProfilePl: 'Kolebka najsłynniejszych aukcji Best of Panama. Mglisty mikroklimat Bajareque tworzy eteryczne nuty jaśminu, bergamotki, papai i białej brzoskwini.',
    flavorProfileEn: 'Home to record-breaking Best of Panama auctions. The misty Bajareque microclimate crafts ethereal floral jasmine, bergamot, and white peach notes.',
    keyNotesPl: ['jaśmin', 'bergamotka', 'biała brzoskwinia', 'kwiat pomarańczy', 'papaja'],
    descriptionPl: 'Wulkan Barú zapewnia unikalny mikroklimat z zimnymi mgłami (Bajareque), które spowalniają dojrzewanie owoców kawowca, potęgując koncentrację cukrów i aromatów kwiatowych.',
    descriptionEn: 'Volcán Barú cradles an extraordinary terroir where cool Bajareque mists delay cherry maturation, packing the beans with intense sugars and delicate aromatics.',
  },
];

// ----------------------------------------------------------------------------
// 4. Tradycyjna Klasyfikacja Herbaty (6 wielkich kategorii)
// ----------------------------------------------------------------------------
export const TEA_CATEGORIES: TeaCategoryInfo[] = [
  {
    id: 'tea-white',
    namePl: 'Biała Herbata',
    nameEn: 'White Tea',
    traditionalName: '白茶 (Bái Chá)',
    oxidationRangePercent: '5% – 10% (minimalna naturalna)',
    killGreenMethod: 'Brak Sha Qing (tylko powolne więdnięcie i suszenie na słońcu)',
    waterTemperatureCelsius: 80.0,
    sensoryProfilePl: 'Krystaliczny, słodki i aksamitny napar. Puszyste srebrzyste pąki (Silver Needle) oraz liście (Pai Mu Tan) dają nuty świeżego melona, suszonego siana, białych kwiatów i miodu lipowego.',
    sensoryProfileEn: 'Crystalline, gentle, and honeyed liquor. Fuzzy silvery buds and leaves deliver sweet melon, dried hay, white blossoms, and mild linden honey.',
    famousVarietiesPl: ['Bai Hao Yin Zhen (Srebrne Igły)', 'Pai Mu Tan (Biała Piwonia)', 'Shou Mei', 'Gong Mei'],
    famousRegions: ['Fuding (Fujian, Chiny)', 'Zhenghe (Fujian, Chiny)'],
    healthAttributesPl: 'Najmniej przetworzona ze wszystkich herbat, zachowuje najwyższe stężenie przeciwutleniaczy polifenolowych.',
    descriptionPl: 'Wyjątkowo subtelna herbata poddawana jedynie procesowi więdnięcia i suszenia bez rolowania i podgrzewania w woku. Pochodzi z prowincji Fujian.',
    descriptionEn: 'The least processed tea variety, consisting solely of gentle withering and sun-drying without rolling or mechanical firing. Native to Fujian.',
  },
  {
    id: 'tea-green',
    namePl: 'Zielona Herbata',
    nameEn: 'Green Tea',
    traditionalName: '绿茶 (Lǜ Chá) / 緑茶 (Ryokucha)',
    oxidationRangePercent: '0% (całkowity brak oksydacji)',
    killGreenMethod: 'Parowanie parą wodną (Japonia: Sencha/Gyokuro) lub prażenie w woku Sha Qing (Chiny: Long Jing)',
    waterTemperatureCelsius: 75.0,
    sensoryProfilePl: 'Bogata w aminokwas L-teaninę i katechiny EGCG. W wersji japońskiej głębokie umami, wodorosty nori i świeży szpinak; w wersji chińskiej prażone kasztany, ryż i świeży groszek cukrowy.',
    sensoryProfileEn: 'Packed with soothing L-theanine and antioxidant catechins. Japanese styles display rich marine umami and steamed spinach; Chinese styles feature sweet roasted chestnut and snow pea.',
    famousVarietiesPl: ['Long Jing (Smocza Studnia)', 'Bi Luo Chun', 'Sencha Asamushi/Fukamushi', 'Gyokuro Uji', 'Matcha (Usucha/Koicha)'],
    famousRegions: ['Hangzhou (Zhejiang, Chiny)', 'Uji (Kioto, Japonia)', 'Shizuoka (Japonia)'],
    healthAttributesPl: 'Wysoka zawartość L-teaniny stymuluje fale mózgowe alfa (spokój i skupienie bez senności).',
    descriptionPl: 'Oksydacja enzymatyczna jest zatrzymywana natychmiast po zbiorze poprzez zastosowanie wysokiej temperatury (Sha Qing lub parowanie), co pozwala zachować żywy zielony kolor i świeżość.',
    descriptionEn: 'Enzymatic oxidation is stopped immediately after harvest through intense pan-firing or steaming, preserving vibrant emerald color and grassy freshness.',
  },
  {
    id: 'tea-yellow',
    namePl: 'Żółta Herbata',
    nameEn: 'Yellow Tea',
    traditionalName: '黄茶 (Huáng Chá)',
    oxidationRangePercent: '10% – 20% (mikro-fermentacja Men Huang)',
    killGreenMethod: 'Wok z fazą dusznego zawijania pod wilgotnym płótnem (Men Huang / Sealing Yellow)',
    waterTemperatureCelsius: 85.0,
    sensoryProfilePl: 'Jedna z najrzadszych herbat na świecie. Proces powolnego duszenia usuwa trawiastą ostrość zielonej herbaty, nadając jej niezwykle gładki, miodowo-orzechowy i maślany charakter o morelowym posmaku.',
    sensoryProfileEn: 'One of the rarest tea types globally. The slow micro-steaming removes grassy astringency, yielding a silky, buttery nectar with dried apricot and roasted almond notes.',
    famousVarietiesPl: ['Jun Shan Yin Zhen (Srebrne Igły z Wyspy Junshan)', 'Meng Ding Huang Ya', 'Huo Shan Huang Ya'],
    famousRegions: ['Jezioro Dongting (Hunan, Chiny)', 'Góra Mengding (Syczuan, Chiny)', 'Huo Shan (Anhui, Chiny)'],
    healthAttributesPl: 'Wyjątkowo łagodna dla żołądka dzięki przekształceniu polifenoli podczas fazy Men Huang.',
    descriptionPl: 'Mistrzowska herbata cesarska. Kluczowy etap Men Huang (żółknięcie w zamknięciu) polega na kilkukrotnym owijaniu ciepłych liści wilgotnym papierem lub tkaniną, co inicjuje łagodną autooksydację.',
    descriptionEn: 'An imperial artisan delicacy. The labor-intensive Men Huang step involves wrapping warm leaves in damp cloths to gently transform grassy tannins into sweet aromatics.',
  },
  {
    id: 'tea-oolong',
    namePl: 'Wulong (Oolong)',
    nameEn: 'Oolong Tea',
    traditionalName: '乌龙茶 (Wūlóng Chá - Czarny Smok)',
    oxidationRangePercent: '15% – 70% (częściowo oksydowana)',
    killGreenMethod: 'Wytrząsanie na bambusowych sitach (Zuo Qing) + prażenie w piecach węglowych',
    waterTemperatureCelsius: 95.0,
    sensoryProfilePl: 'Szczyt kunsztu herbacianego. Niezwykła rozpiętość: od świeżych, zielonych oolongów o aromacie bzu i orchidei (Tie Guan Yin, Ali Shan), po głęboko pieczone skalne Yan Cha (Da Hong Pao, Rou Gui) o nutach pieczonego chleba, miodu i mineralności.',
    sensoryProfileEn: 'The pinnacle of tea processing complexity. Ranging from light floral lilacs and orchid blossoms (Tie Guan Yin, Ali Shan) to deeply roasted mineral rock teas (Da Hong Pao, Rou Gui).',
    famousVarietiesPl: ['Da Hong Pao (Wielka Czerwona Szata)', 'Tie Guan Yin (Żelazna Bogini)', 'Dan Cong (Fenghuang)', 'Dong Ding Oolong', 'Ali Shan High Mountain'],
    famousRegions: ['Wuyi Shan (Fujian, Chiny)', 'Anxi (Fujian, Chiny)', 'Fenghuang Shan (Guangdong, Chiny)', 'Nantou (Tajwan)'],
    healthAttributesPl: 'Zrównoważona zawartość polifenoli i teaniny, doskonała dla trawienia po posiłkach.',
    descriptionPl: 'Mistrzowie herbaty kontrolują oksydację poprzez mechaniczne obijanie brzegów liści na bambusowych tacach. Pozwala to na jednoczesne zachowanie świeżości wnętrza liścia i dojrzałości jego brzegów.',
    descriptionEn: 'Crafted through rhythmic bruising of leaf edges on bamboo trays. Balances the fresh vitality of green tea with the warm complexity of black tea.',
  },
  {
    id: 'tea-black',
    namePl: 'Czarna (Czerwona) Herbata',
    nameEn: 'Black Tea (Hong Cha)',
    traditionalName: '红茶 (Hóng Chá - Czerwona Herbata)',
    oxidationRangePercent: '100% (pełna oksydacja enzymatyczna)',
    killGreenMethod: 'Pełne rolowanie i wielogodzinna oksydacja w wilgotnym powietrzu, następnie suszenie',
    waterTemperatureCelsius: 98.0,
    sensoryProfilePl: 'W tradycji azjatyckiej zwana czerwoną (od rubinowego koloru likieru). Ciepłe nuty słodu, ciemnego miodu, czekolady, dojrzałych fig i drewna różanego. Indyjski Darjeeling dodaje nuty muszkatołowe, a Assam głębokie ciało.',
    sensoryProfileEn: 'Known as Red Tea in Asia for its radiant amber-ruby broth. Warming tones of barley malt, wild dark honey, cocoa nibs, dried figs, and muscatel grapes.',
    famousVarietiesPl: ['Zheng Shan Xiao Zhong (Lapsang Souchong)', 'Keemun (Qimen Hong Cha)', 'Dian Hong (Yunnan Red)', 'Darjeeling First/Second Flush', 'Assam CTC'],
    famousRegions: ['Wuyi Shan (Fujian, Chiny)', 'Qimen (Anhui, Chiny)', 'Dianxi (Yunnan, Chiny)', 'Darjeeling & Assam (Indie)'],
    healthAttributesPl: 'Zawiera teaflawiny i tearubiginy wspierające układ krążenia i naturalną witalność.',
    descriptionPl: 'Liście są w 100% utleniane enzymatycznie po intensywnym rolowaniu niszczącym ściany komórkowe. Klasyczny Zheng Shan Xiao Zhong z gór Wuyi dał początek światowej kulturze czarnej herbaty.',
    descriptionEn: 'Fully oxidized tea with leaves completely rolled to release enzymatic polyphenols. Originating in the Wuyi Mountains, it sparked worldwide tea trade routes.',
  },
  {
    id: 'tea-puerh',
    namePl: 'Ciemna Herbata / Puerh',
    nameEn: 'Dark Tea / Puerh (Heicha)',
    traditionalName: '黑茶 (Hēichá) / 普洱茶 (Pǔ’ěr Chá)',
    oxidationRangePercent: 'Post-fermentacja mikrobiologiczna (od miesięcy do dziesięcioleci)',
    killGreenMethod: 'Sha Qing w słońcu (Maocha) + dojrzewanie naturalne (Sheng) lub stosowe Wo Dui (Shou)',
    waterTemperatureCelsius: 98.0,
    sensoryProfilePl: 'Herbata żywa, dojrzewająca jak wino. Młody Sheng Puerh jest dziki, kwiatowy i taniczny; starzony Sheng nabiera nut suszonych śliwek, kamfory i skóry. Shou Puerh oferuje głęboki, gęsty napar o nutach ściółki leśnej, mchu, torfu i gorzkiej czekolady.',
    sensoryProfileEn: 'Living fermented tea that ages like vintage wine. Raw Sheng puerh starts brisk, floral, and tannic, evolving into camphor and sweet dried plums. Ripe Shou delivers rich forest floor, wet stone, and dark peat.',
    famousVarietiesPl: ['Sheng Puerh (Raw Puerh z wiekowych drzew Gushu)', 'Shou Puerh (Ripe Puerh)', 'Anhua Heicha (Cegły Qianliang)', 'Liu Bao Heicha'],
    famousRegions: ['Xishuangbanna (Yunnan, Chiny)', 'Pu’er (Yunnan, Chiny)', 'Lincang (Yunnan, Chiny)', 'Anhua (Hunan, Chiny)'],
    healthAttributesPl: 'Tradycyjnie stosowana w medycynie chińskiej dla wsparcia metabolizmu lipidów i flory bakteryjnej jelit.',
    descriptionPl: 'Herbata poddawana fermentacji z udziałem mikroorganizmów (Aspergillus, drożdże). Puerhy z Yunnanu prasowane są w tradycyjne dyski Bing Cha (357g) lub cegły.',
    descriptionEn: 'Microbiologically post-fermented tea from large-leaf ancient Yunnan trees (Daye). Pressed into traditional 357g cakes (Bing Cha) or bricks for long-term aging.',
  },
];

// ----------------------------------------------------------------------------
// Funkcje pomocnicze wyszukiwania i odczytu
// ----------------------------------------------------------------------------

export function searchCoffeeVarieties(query: string): CoffeeVarietyInfo[] {
  if (!query || !query.trim()) return COFFEE_VARIETIES;
  const q = query.toLowerCase().trim();
  return COFFEE_VARIETIES.filter((v) =>
    v.name.toLowerCase().includes(q) ||
    v.nativeRegion.toLowerCase().includes(q) ||
    v.keyNotesPl.some((k) => k.toLowerCase().includes(q)) ||
    v.keyNotesEn.some((k) => k.toLowerCase().includes(q)) ||
    v.sensoryProfilePl.toLowerCase().includes(q)
  );
}

export function searchCoffeeProcesses(query: string): CoffeeProcessInfo[] {
  if (!query || !query.trim()) return COFFEE_PROCESSES;
  const q = query.toLowerCase().trim();
  return COFFEE_PROCESSES.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.processType.toLowerCase().includes(q) ||
    p.keyNotesPl.some((k) => k.toLowerCase().includes(q)) ||
    p.sensoryImpactPl.toLowerCase().includes(q)
  );
}

export function searchCoffeeOrigins(query: string): CoffeeOriginInfo[] {
  if (!query || !query.trim()) return COFFEE_ORIGINS;
  const q = query.toLowerCase().trim();
  return COFFEE_ORIGINS.filter((o) =>
    o.country.toLowerCase().includes(q) ||
    o.primaryRegions.some((r) => r.toLowerCase().includes(q)) ||
    o.mainVarieties.some((v) => v.toLowerCase().includes(q)) ||
    o.flavorProfilePl.toLowerCase().includes(q)
  );
}

export function searchTeaCategories(query: string): TeaCategoryInfo[] {
  if (!query || !query.trim()) return TEA_CATEGORIES;
  const q = query.toLowerCase().trim();
  return TEA_CATEGORIES.filter((t) =>
    t.namePl.toLowerCase().includes(q) ||
    t.nameEn.toLowerCase().includes(q) ||
    t.traditionalName.toLowerCase().includes(q) ||
    t.famousVarietiesPl.some((v) => v.toLowerCase().includes(q)) ||
    t.famousRegions.some((r) => r.toLowerCase().includes(q)) ||
    t.sensoryProfilePl.toLowerCase().includes(q)
  );
}

export function findCoffeeVarietyById(id: string): CoffeeVarietyInfo | undefined {
  return COFFEE_VARIETIES.find((v) => v.id === id);
}

export function findCoffeeProcessById(id: string): CoffeeProcessInfo | undefined {
  return COFFEE_PROCESSES.find((p) => p.id === id);
}

export function findCoffeeOriginById(id: string): CoffeeOriginInfo | undefined {
  return COFFEE_ORIGINS.find((o) => o.id === id);
}

export function findTeaCategoryById(id: string): TeaCategoryInfo | undefined {
  return TEA_CATEGORIES.find((t) => t.id === id);
}
