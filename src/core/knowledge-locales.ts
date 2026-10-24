// ============================================================================
// Napar (Steepwise) — Knowledge Base i18n Strings Catalog (TASK-R09-02) [T:ASTILL-TEA-2001] [T:WCR-VARIETIES]
// ============================================================================

export interface KnowledgeLocaleEntry {
  sensoryProfilePl?: string;
  sensoryProfileEn?: string;
  sensoryImpactPl?: string;
  sensoryImpactEn?: string;
  flavorProfilePl?: string;
  flavorProfileEn?: string;
  descriptionPl: string;
  descriptionEn: string;
  namePl?: string;
  nameEn?: string;
  keyNotesPl?: string[];
  keyNotesEn?: string[];
  healthAttributesPl?: string;
  famousVarietiesPl?: string[];
}

export const KNOWLEDGE_LOCALES: Record<string, KnowledgeLocaleEntry> = {
  "variety-geisha": {
    "sensoryProfilePl": "Krystaliczna czystość, herbaciane i zwiewne ciało, intensywny aromat jaśminu, bergamotki, białej brzoskwini i kwiatu pomarańczy.",
    "sensoryProfileEn": "Crystal clarity, tea-like delicate body, explosive jasmine floral aroma, bergamot, white peach, and orange blossom.",
    "descriptionPl": "Najbardziej ceniona i wielokrotnie nagradzana odmiana w świecie specialty. Odkryta w Etiopii w latach 30., zyskała legendarny status po aukcji Best of Panama 2004 na farmie Hacienda La Esmeralda.",
    "descriptionEn": "The most prestigious and highly priced variety in specialty coffee history. Brought from Ethiopia in the 1930s, it achieved legendary status during the 2004 Best of Panama auction by Hacienda La Esmeralda.",
    "keyNotesPl": [
      "jaśmin",
      "bergamotka",
      "biała brzoskwinia",
      "kwiat pomarańczy",
      "czarna herbata"
    ],
    "keyNotesEn": [
      "jasmine",
      "bergamot",
      "white peach",
      "orange blossom",
      "black tea"
    ]
  },
  "variety-sl28-sl34": {
    "sensoryProfilePl": "Znak rozpoznawczy afrykańskich filtrów: soczysta, fosforowa kwasowość, nuty czarnej porzeczki, rabarbaru, jeżyn i wina musującego.",
    "sensoryProfileEn": "The hallmark of Kenyan specialty coffee: crisp phosphoric acidity, intense blackcurrant, rhubarb, blackberry, and sparkling wine tones.",
    "descriptionPl": "Odmiany wyhodowane w Scott Laboratories w Kenii. Wyjątkowo odporne na suszę, słyną z unikalnej obecności kwasu fosforowego wzmacniającego soczystość owocową.",
    "descriptionEn": "Bred in Kenya during the 1930s by Scott Agricultural Laboratories. Renowned for drought tolerance and an unmistakable phosphoric acidity that creates a sparkling mouthfeel.",
    "keyNotesPl": [
      "czarna porzeczka",
      "rabarbar",
      "jeżyna",
      "czerwona porzeczka",
      "czerwony grejpfrut"
    ],
    "keyNotesEn": [
      "blackcurrant",
      "rhubarb",
      "blackberry",
      "redcurrant",
      "ruby grapefruit"
    ]
  },
  "variety-pink-bourbon": {
    "sensoryProfilePl": "Rzadka odmiana o dojrzałych różowo-łososiowych owocach. Niezwykle słodka, łącząca nuty różowego grejpfruta, papai, marakui i miodu z kremową konsystencją.",
    "sensoryProfileEn": "Rare variety yielding salmon-pink cherries. Exceptionally sweet, showcasing pink grapefruit, papaya, passion fruit, and honey blossom with a silky texture.",
    "descriptionPl": "Początkowo uważany za krzyżówkę Red i Yellow Bourbon, badania DNA wykazały pokrewieństwo z odmianami etiopskimi. Dojrzałe owoce mają unikalny różowy kolor.",
    "descriptionEn": "Initially thought to be a cross of Red and Yellow Bourbon, recent DNA sequencing traced its roots to Ethiopian landraces. Ripe cherries bear a distinctive rose-pink hue.",
    "keyNotesPl": [
      "różowy grejpfrut",
      "papaja",
      "kwiat jaśminu",
      "marakuja",
      "miód akacjowy"
    ],
    "keyNotesEn": [
      "pink grapefruit",
      "papaya",
      "jasmine flower",
      "passion fruit",
      "acacia honey"
    ]
  },
  "variety-ethiopian-landraces": {
    "sensoryProfilePl": "Wielowymiarowa eksplozja kwiatowa i cytrusowa. Bergamotka, kwiat lipy, trawa cytrynowa, słodka morela i czysta czarna herbata.",
    "sensoryProfileEn": "Multidimensional floral and citrus explosion. Bergamot, linden flower, lemongrass, sweet apricot, and crisp black tea.",
    "descriptionPl": "W Etiopii rosną tysiące nienazwanych odmian botanicznych (szacuje się od 6 000 do 10 000 szczepów). Nazwy selekcji regionalnych to m.in. Kurume, Dega, Wolisho czy Bedessa.",
    "descriptionEn": "Ethiopia is the birthplace of Arabica coffee, harboring an estimated 6,000 to 10,000 wild indigenous cultivars referred to collectively as Ethiopian Landraces or Heirloom.",
    "keyNotesPl": [
      "bergamotka",
      "herbata Earl Grey",
      "trawa cytrynowa",
      "morela",
      "kwiat lipy"
    ],
    "keyNotesEn": [
      "bergamot",
      "Earl Grey tea",
      "lemongrass",
      "apricot",
      "linden blossom"
    ]
  },
  "variety-bourbon": {
    "sensoryProfilePl": "Archetyp słodkiej i zbalansowanej kawy: gęsty karmel, mleczna czekolada, czerwone jabłko i zrównoważona kwasowość kwasu jabłkowego.",
    "sensoryProfileEn": "The archetype of sweet, balanced coffee: rich caramel, milk chocolate, crisp red apple, and balanced malic acidity.",
    "descriptionPl": "Jedna z najważniejszych historycznie odmian Arabiki. Rozprzestrzeniona w Ameryce Łacińskiej i Afryce, ceniona za wyśmienitą słodycz i doskonałe ciało.",
    "descriptionEn": "One of the foundational Arabica varieties. Spread across the Americas and Africa, cherished for its rich natural sweetness and well-rounded body.",
    "keyNotesPl": [
      "mleczna czekolada",
      "karmel",
      "czerwone jabłko",
      "wanilia",
      "orzech laskowy"
    ],
    "keyNotesEn": [
      "milk chocolate",
      "caramel",
      "red apple",
      "vanilla",
      "hazelnut"
    ]
  },
  "variety-typica": {
    "sensoryProfilePl": "Arystokratyczna elegancja w filiżance. Czysty, aksamitny napar o nutach kwiatów cytryny, słodkiego kakao, melasy i świeżej gruszki.",
    "sensoryProfileEn": "Aristocratic cup elegance. Clean, velvety brew highlighting lemon blossoms, sweet cocoa, molasses, and fresh pear.",
    "descriptionPl": "Pierwsza odmiana kawy wywieziona z Jemenu do Indii i Indonezji, a stamtąd do Europy i obu Ameryk. Charakteryzuje się stożkowym pokrojem krzewu i brązowymi młodymi liśćmi.",
    "descriptionEn": "The original variety exported from Yemen to India, Indonesia, and across the globe. Features tall conical trees with bronze-tipped young leaves.",
    "keyNotesPl": [
      "kwiat cytryny",
      "słodkie kakao",
      "melasa",
      "orzech włoski",
      "gruszka"
    ],
    "keyNotesEn": [
      "lemon blossom",
      "sweet cocoa",
      "molasses",
      "walnut",
      "pear"
    ]
  },
  "variety-caturra-catuai": {
    "sensoryProfilePl": "Kompaktowe krzewy dające czysty profil o żywej kwasowości cytrusowej, nutach migdałów, czekolady deserowej i miodu trzcinowego.",
    "sensoryProfileEn": "Compact dwarf cultivars producing clean cup profiles with lively citrus notes, toasted almonds, dark chocolate, and cane sugar sweetness.",
    "descriptionPl": "Odmiany o niższym wzroście, umożliwiające gęstsze nasadzenia i łatwiejszy zbiór ręczny na stromych zboczach Ameryki Środkowej. Znakomity standard specialty.",
    "descriptionEn": "Semi-dwarf cultivars developed in Brazil allowing high-density planting. Highly popular across Central America for their solid yields and reliable cup quality.",
    "keyNotesPl": [
      "migdały",
      "cytryna",
      "miód trzcinowy",
      "kakao",
      "jabłko"
    ],
    "keyNotesEn": [
      "almonds",
      "lemon",
      "cane sugar",
      "cocoa",
      "apple"
    ]
  },
  "variety-pacamara-maragogype": {
    "sensoryProfilePl": "Wielkie ziarna (Elephant Beans) dające gęste, syropowate body, pikantne nuty ziół, tytoniu, marakui i czekolady deserowej.",
    "sensoryProfileEn": "Giant elephant beans yielding syrupy, heavy body, exotic spices, sweet pipe tobacco, passion fruit, and rich dark chocolate.",
    "descriptionPl": "Odmiana Pacamara wyhodowana w Salwadorze (ISIC) w wyniku 30 lat badań. Ceniona za niezwykłą złożoność sensoryczną i rozmiar sita (Screen 19+).",
    "descriptionEn": "Pacamara was bred in El Salvador after 30 years of scientific research. Cherished by brewers for its massive bean size and deeply complex, savory-sweet flavor spectrum.",
    "keyNotesPl": [
      "marakuja",
      "czekolada deserowa",
      "tytoń",
      "cedr",
      "kardamon"
    ],
    "keyNotesEn": [
      "passion fruit",
      "dark chocolate",
      "sweet tobacco",
      "cedar",
      "cardamom"
    ]
  },
  "variety-castillo-colombia": {
    "sensoryProfilePl": "Filary kolumbijskiego rolnictwa specialty. Zbalansowany napar o nutach czerwonych owoców, karmelu, cytrusów i mlecznej czekolady.",
    "sensoryProfileEn": "The pillars of modern Colombian coffee farming. Balanced cup with red fruit nuances, panela caramel, citrus, and smooth milk chocolate.",
    "descriptionPl": "Opracowane przez instytut Cenicafé w celu ochrony farmerów przed niszczycielską rdzą kawową (Hemileia vastatrix), przy jednoczesnym zachowaniu standardów jakości specialty.",
    "descriptionEn": "Engineered by Cenicafé to resist devastating coffee leaf rust (roya) while preserving excellent sensory scores under specialty farming conditions.",
    "keyNotesPl": [
      "wiśnia",
      "karmel",
      "pomarańcza",
      "czekolada mleczna",
      "panela"
    ],
    "keyNotesEn": [
      "cherry",
      "caramel",
      "orange",
      "milk chocolate",
      "panela"
    ]
  },
  "variety-eugenioides": {
    "sensoryProfilePl": "Unikat światowy o znikomej goryczy i niskiej zawartości kofeiny (ok. 0.2%). Szokująca naturalna słodycz pieczonych pianek marshmallows, sezamu, mleka i papai.",
    "sensoryProfileEn": "Extremely rare species with nearly zero bitterness and low caffeine (~0.2%). Incredible natural sweetness of toasted marshmallows, sesame candy, and tropical papaya.",
    "descriptionPl": "Gatunek botaniczny, który dał początek Arabice w wyniku naturalnego skrzyżowania z Robustą (Canephora). Używany przez mistrzów świata (WBC) do tworzenia zaskakujących profili smakowych.",
    "descriptionEn": "The diploid maternal parent species of Coffea Arabica. Celebrated by World Barista Champions for its astonishing candy-sweet profile devoid of chlorogenic acid bitterness.",
    "keyNotesPl": [
      "pianki marshmallow",
      "prażony sezam",
      "papaja",
      "mleczna słodycz",
      "guawa"
    ],
    "keyNotesEn": [
      "marshmallow",
      "toasted sesame",
      "papaya",
      "milky sweetness",
      "guava"
    ]
  },
  "process-washed": {
    "sensoryImpactPl": "Maksymalna przejrzystość i klarowność terroir. Owoce są depulpowane natychmiast po zbiorze, a resztki miąższu usuwane w fermentacji wodnej. Uwypukla kwasowość owocową i nuty kwiatowe.",
    "sensoryImpactEn": "Maximum terroir clarity and crispness. Fruit is pulped immediately and fermented in water tanks. Amplifies floral aromatics and sparkling fruit acidity.",
    "descriptionPl": "Klasyczna metoda obróbki powstała w XIX wieku w Ameryce Środkowej. Umożliwia precyzyjną ocenę jakości ziaren bez posmaków wynikających z fermentacji suszącego się miąższu.",
    "descriptionEn": "The traditional wet process originating in the 19th century. Removes the fruit flesh before drying, spotlighting the pure genetic and soil characteristics of the bean.",
    "keyNotesPl": [
      "czystość",
      "wysoka kwasowość",
      "jaśmin",
      "cytrusy",
      "zielona herbata"
    ],
    "keyNotesEn": [
      "cleanliness",
      "crisp acidity",
      "jasmine",
      "citrus",
      "green tea"
    ]
  },
  "process-natural": {
    "sensoryImpactPl": "Owoce kawowca suszone są w całości ze skórką i miąższem. Cukry z owocu przenikają do ziarna, dając ciężkie body, intensywne nuty dojrzałych truskawek, borówek, likieru i czekolady.",
    "sensoryImpactEn": "Whole cherries dried under the sun with skin and pulp intact. Sugars migrate into the seed, producing heavy body, ripe strawberries, blueberries, and wine-like liqueur.",
    "descriptionPl": "Najstarsza historycznie metoda obróbki, charakterystyczna dla suchych regionów Etiopii (Harrar, Guji) i plantacji w Brazylii. Wymaga nieustannego grabienia ziaren na łożach, by uniknąć pleśni.",
    "descriptionEn": "The oldest processing method, native to arid regions of Ethiopia and vast Brazilian plateaus. Requires vigilant turning on raised drying beds to prevent over-fermentation.",
    "keyNotesPl": [
      "truskawka",
      "borówka",
      "dżem owocowy",
      "likier",
      "gęste body"
    ],
    "keyNotesEn": [
      "strawberry",
      "blueberry",
      "fruit jam",
      "liqueur",
      "heavy body"
    ]
  },
  "process-honey": {
    "sensoryImpactPl": "Skórka jest usuwana, ale część lepkiego miąższu (mucilage) pozostaje na ziarnie. Zależnie od ilości pozostawionego śluzu wyróżnia się Yellow (25%), Red (50%) i Black Honey (100%). Łączy czystość Washed ze słodyczą Naturala.",
    "sensoryImpactEn": "Pulp is stripped while sticky mucilage remains during drying. Graded as Yellow (25%), Red (50%), or Black Honey (100%). Blends washed clarity with natural sweetness.",
    "descriptionPl": "Pionierami metody Honey byli farmerzy z Kostaryki po trzęsieniu ziemi w 2008 roku, które odcięło dostęp do wody. Stała się znakiem rozpoznawczym innowacji mikromłynów w Ameryce Środkowej.",
    "descriptionEn": "Pioneered in Costa Rica after the 2008 earthquake limited water infrastructure. Today, honey processing defines Central American micro-mill craftsmanship.",
    "keyNotesPl": [
      "miód",
      "brzoskwinia",
      "żółta śliwka",
      "karmel",
      "aksamitny finisz"
    ],
    "keyNotesEn": [
      "honey",
      "peach",
      "yellow plum",
      "caramel",
      "silky finish"
    ]
  },
  "process-anaerobic": {
    "sensoryImpactPl": "Kontrolowana fermentacja w szczelnie zamkniętych tankach ze stali nierdzewnej z zaworem odprowadzającym tlen i CO2. Pozwala na rozwój specyficznych szczepów drożdży i bakterii kwasu mlekowego, dając nuty cynamonu, jogurtu, ananasa i gumy balonowej.",
    "sensoryImpactEn": "Oxygen-deprived fermentation in sealed stainless tanks with one-way release valves. Promotes lactic bacteria and wild yeasts, yielding cinnamon, Greek yogurt, and tropical punch.",
    "descriptionPl": "Nowoczesny trend fermentacji precyzyjnej w specialty. Kontrola temperatury i poziomu pH w zamkniętym naczyniu pozwala na powtarzalne uzyskiwanie egzotycznych, wielowarstwowych nut smakowych.",
    "descriptionEn": "Modern precision biotechnology applied to specialty coffee. Monitoring tank temperature, Brix sugars, and pH produces repeatable, exotic flavor profiles.",
    "keyNotesPl": [
      "cynamon",
      "jogurt grecki",
      "ananas",
      "marakuja",
      "guma balonowa"
    ],
    "keyNotesEn": [
      "cinnamon",
      "greek yogurt",
      "pineapple",
      "passion fruit",
      "bubblegum"
    ]
  },
  "process-carbonic-maceration": {
    "sensoryImpactPl": "Technika zaadaptowana ze świata winiarskiego (Beaujolais) przez Mistrza Świata Baristów Sasę Sestica. Całe owoce umieszczane są w zbiorniku przesyconym dwutlenkiem węgla, inicjując fermentację wewnątrz pojedynczych nienaruszonych owoców. Daje profil kandyzowanych wiśni, malin i wina musującego.",
    "sensoryImpactEn": "Wine-making technique brought to coffee by WBC Champion Sasa Sestic. Cherries ferment intracellularly in pressurized carbon dioxide tanks, unlocking candied cherries and sparkling wine.",
    "descriptionPl": "Proces zyskał sławę na mistrzostwach świata w Seattle (2015). Rozbicie pektyn zachodzi od wewnątrz nasiona bez dostępu tlenu, dając spektakularną czystość i unikalną strukturę kwasowości.",
    "descriptionEn": "Rose to worldwide acclaim during the 2015 World Barista Championship. Intracellular enzymatic breakdown yields singular candied fruit and wine aromas.",
    "keyNotesPl": [
      "kandyzowana wiśnia",
      "malina",
      "wino musujące",
      "czerwona porzeczka"
    ],
    "keyNotesEn": [
      "candied cherry",
      "raspberry",
      "sparkling wine",
      "redcurrant"
    ]
  },
  "process-wet-hulled": {
    "sensoryImpactPl": "Tradycyjna metoda z wysp Indonezji (Sumatra, Sulawesi) wymuszona wysoką wilgotnością tropikalną. Pergamin jest usuwany, gdy ziarno jest jeszcze miękkie i wilgotne. Tworzy charakterystyczny ciemnozielony kolor ziarna, bardzo niską kwasowość, nuty cedru, tytoniu, ziół leśnych i ziemistą słodycz.",
    "sensoryImpactEn": "Unique Indonesian method driven by tropical humidity. Beans are hulled while still soft at 30-35% moisture, creating blue-green seeds, low acidity, cedarwood, and earthy sweetness.",
    "descriptionPl": "Specjalność wysp indonezyjskich. Wilgotny klimat uniemożliwia powolne tradycyjne suszenie, stąd łuskanie półmokrego ziarna przed ostatecznym dosuszeniem na słońcu.",
    "descriptionEn": "Signature method of Sumatra and Sulawesi. The tropical rainfall necessitates hulling at high moisture content, giving Sumatran coffees their legendary heavy syrupy body.",
    "keyNotesPl": [
      "cedr",
      "tytoń",
      "leśne zioła",
      "ciemna czekolada",
      "bardzo niska kwasowość"
    ],
    "keyNotesEn": [
      "cedarwood",
      "pipe tobacco",
      "forest herbs",
      "dark chocolate",
      "very low acidity"
    ]
  },
  "origin-ethiopia": {
    "flavorProfilePl": "Światowa stolica aromatu kwiatowego: jaśmin, herbata Earl Grey, bergamotka, soczyste owoce cytrusowe i morele.",
    "flavorProfileEn": "The global capital of floral complexity: jasmine, Earl Grey tea, bergamot, lively citrus, and sun-ripened apricots.",
    "descriptionPl": "Kolebka kawy Arabica. Uprawiana głównie w zacienionych ogrodach leśnych (Garden Coffee) przez setki tysięcy drobnych rolników zrzeszonych w spółdzielniach.",
    "descriptionEn": "The birthplace of coffee. Grown mostly in shaded smallholder gardens under canopy trees at breathtaking high altitudes.",
    "keyNotesPl": [
      "jaśmin",
      "bergamotka",
      "Earl Grey",
      "morela",
      "brzoskwinia"
    ]
  },
  "origin-kenya": {
    "flavorProfilePl": "Niezrównana kwasowość kwasu fosforowego, intensywna czarna porzeczka, rabarbar, owoce leśne i soczysty finisz.",
    "flavorProfileEn": "Unrivalled sparkling phosphoric acidity, intense blackcurrant, tart rhubarb, forest berries, and sweet savory juiciness.",
    "descriptionPl": "Żyzne czerwone gleby wulkaniczne wokół Mount Kenya oraz rygorystyczny system stacji mycia (wet mills/factories) tworzą jedne z najczystszych i najbardziej wyrazistych kaw świata.",
    "descriptionEn": "Red volcanic soils around Mount Kenya and rigorous wet-mill sorting at cooperative factories produce some of the most vibrant coffees on Earth.",
    "keyNotesPl": [
      "czarna porzeczka",
      "rabarbar",
      "jeżyna",
      "śliwka",
      "czerwony grejpfrut"
    ]
  },
  "origin-colombia": {
    "flavorProfilePl": "Czysta słodycz trzcinowa (panela), czerwone jabłko, karmel, cytrusy i jedwabiste, zbalansowane body.",
    "flavorProfileEn": "Pure cane sugar sweetness (panela), crisp red apple, caramel, citrus zest, and silky balanced body.",
    "descriptionPl": "Trzeci producent kawy na świecie i lider jakości specialty. Zróżnicowane łańcuchy Andów pozwalają na zbiory świeżej kawy w różnych regionach przez 12 miesięcy w roku.",
    "descriptionEn": "A global powerhouse of specialty coffee. Three cordilleras of the Andes create distinct microclimates, enabling fresh harvest year-round.",
    "keyNotesPl": [
      "panela",
      "czerwone jabłko",
      "karmel",
      "pomarańcza",
      "mleczna czekolada"
    ]
  },
  "origin-guatemala": {
    "flavorProfilePl": "Wpływ żyznych popiołów wulkanicznych: bogata czekolada deserowa, kakao, nuty korzenne, jabłkowa kwasowość i gęste body.",
    "flavorProfileEn": "Rich volcanic soil influence: dark chocolate, baker cocoa, warm spices, crisp malic acidity, and syrupy body.",
    "descriptionPl": "Kraj wulkanów i mikroklimatów. W regionie Huehuetenango suche, gorące wiatry z Meksyku chronią uprawy przed przymrozkami na wysokościach sięgających 2000 m n.p.m.",
    "descriptionEn": "Land of volcanoes and microclimates. In Huehuetenango, warm winds from Mexican plains protect highland coffee farms from frost up to 2,000m.",
    "keyNotesPl": [
      "czekolada deserowa",
      "kakao",
      "cynamon",
      "jabłko",
      "orzech laskowy"
    ]
  },
  "origin-costa-rica": {
    "flavorProfilePl": "Światowy lider innowacji honey/anaerobic. Niezwykle słodki profil miodowy, żółte owoce, morele i maślany finisz.",
    "flavorProfileEn": "Pioneers of honey and experimental anaerobic fermentations. Intensely sweet honeyed cup, apricot, yellow stone fruits, and buttered finish.",
    "descriptionPl": "Kraj o najwyższych standardach ekologicznych i technicznych. Uprawa Robusty była tu prawnie zakazana przez dziesięciolecia, by chronić reputację kostarykańskiej Arabiki.",
    "descriptionEn": "World-renowned for ecological sustainability and micro-mill processing innovation. Robusta cultivation was banned for decades to protect Arabica pedigree.",
    "keyNotesPl": [
      "miód",
      "morela",
      "żółta brzoskwinia",
      "wanilia",
      "karmel"
    ]
  },
  "origin-brazil": {
    "flavorProfilePl": "Fundament słodyczy i kremowego espresso. Niska kwasowość, orzechy laskowe, migdały, mleczna czekolada i suszone owoce.",
    "flavorProfileEn": "The cornerstone of sweet, chocolatey espresso blends. Mild acidity, toasted hazelnuts, milk chocolate, and sun-dried fruit sweetness.",
    "descriptionPl": "Największy producent kawy na świecie od ponad 150 lat. Oprócz wielkich farm zmechanizowanych, regiony Sul de Minas i Cerrado produkują wybitne Yellow Bourbony o rzemieślniczym charakterze.",
    "descriptionEn": "The world’s largest coffee producer for over 150 years. Alongside vast mechanized estates, mountainous micro-regions craft exceptional specialty lots.",
    "keyNotesPl": [
      "orzech laskowy",
      "mleczna czekolada",
      "migdały",
      "karmel",
      "suszona śliwka"
    ]
  },
  "origin-panama": {
    "flavorProfilePl": "Kolebka najsłynniejszych aukcji Best of Panama. Mglisty mikroklimat Bajareque tworzy eteryczne nuty jaśminu, bergamotki, papai i białej brzoskwini.",
    "flavorProfileEn": "Home to record-breaking Best of Panama auctions. The misty Bajareque microclimate crafts ethereal floral jasmine, bergamot, and white peach notes.",
    "descriptionPl": "Wulkan Barú zapewnia unikalny mikroklimat z zimnymi mgłami (Bajareque), które spowalniają dojrzewanie owoców kawowca, potęgując koncentrację cukrów i aromatów kwiatowych.",
    "descriptionEn": "Volcán Barú cradles an extraordinary terroir where cool Bajareque mists delay cherry maturation, packing the beans with intense sugars and delicate aromatics.",
    "keyNotesPl": [
      "jaśmin",
      "bergamotka",
      "biała brzoskwinia",
      "kwiat pomarańczy",
      "papaja"
    ]
  },
  "tea-white": {
    "namePl": "Biała Herbata",
    "nameEn": "White Tea",
    "sensoryProfilePl": "Krystaliczny, słodki i aksamitny napar. Puszyste srebrzyste pąki (Silver Needle) oraz liście (Pai Mu Tan) dają nuty świeżego melona, suszonego siana, białych kwiatów i miodu lipowego.",
    "sensoryProfileEn": "Crystalline, gentle, and honeyed liquor. Fuzzy silvery buds and leaves deliver sweet melon, dried hay, white blossoms, and mild linden honey.",
    "descriptionPl": "Wyjątkowo subtelna herbata poddawana jedynie procesowi więdnięcia i suszenia bez rolowania i podgrzewania w woku. Pochodzi z prowincji Fujian.",
    "descriptionEn": "The least processed tea variety, consisting solely of gentle withering and sun-drying without rolling or mechanical firing. Native to Fujian.",
    "healthAttributesPl": "Najmniej przetworzona ze wszystkich herbat, bogata w naturalne polifenole roślinne (katechiny i flawonoidy).",
    "famousVarietiesPl": [
      "Bai Hao Yin Zhen (Srebrne Igły)",
      "Pai Mu Tan (Biała Piwonia)",
      "Shou Mei",
      "Gong Mei"
    ]
  },
  "tea-green": {
    "namePl": "Zielona Herbata",
    "nameEn": "Green Tea",
    "sensoryProfilePl": "Bogata w aminokwas L-teaninę i katechiny EGCG. W wersji japońskiej głębokie umami, wodorosty nori i świeży szpinak; w wersji chińskiej prażone kasztany, ryż i świeży groszek cukrowy.",
    "sensoryProfileEn": "Packed with soothing L-theanine and antioxidant catechins. Japanese styles display rich marine umami and steamed spinach; Chinese styles feature sweet roasted chestnut and snow pea.",
    "descriptionPl": "Oksydacja enzymatyczna jest zatrzymywana natychmiast po zbiorze poprzez zastosowanie wysokiej temperatury (Sha Qing lub parowanie), co pozwala zachować żywy zielony kolor i świeżość.",
    "descriptionEn": "Enzymatic oxidation is stopped immediately after harvest through intense pan-firing or steaming, preserving vibrant emerald color and grassy freshness.",
    "healthAttributesPl": "Zawiera naturalną L-teaninę oraz kofeinę o zrównoważonym profilu uwalniania.",
    "famousVarietiesPl": [
      "Long Jing (Smocza Studnia)",
      "Bi Luo Chun",
      "Sencha Asamushi/Fukamushi",
      "Gyokuro Uji",
      "Matcha (Usucha/Koicha)"
    ]
  },
  "tea-yellow": {
    "namePl": "Żółta Herbata",
    "nameEn": "Yellow Tea",
    "sensoryProfilePl": "Jedna z najrzadszych herbat na świecie. Proces powolnego duszenia usuwa trawiastą ostrość zielonej herbaty, nadając jej niezwykle gładki, miodowo-orzechowy i maślany charakter o morelowym posmaku.",
    "sensoryProfileEn": "One of the rarest tea types globally. The slow micro-steaming removes grassy astringency, yielding a silky, buttery nectar with dried apricot and roasted almond notes.",
    "descriptionPl": "Mistrzowska herbata cesarska. Kluczowy etap Men Huang (żółknięcie w zamknięciu) polega na kilkukrotnym owijaniu ciepłych liści wilgotnym papierem lub tkaniną, co inicjuje łagodną autooksydację.",
    "descriptionEn": "An imperial artisan delicacy. The labor-intensive Men Huang step involves wrapping warm leaves in damp cloths to gently transform grassy tannins into sweet aromatics.",
    "healthAttributesPl": "Tradycyjnie ceniona za łagodny profil sensoryczny uzyskany podczas powolnej autooksydacji Men Huang.",
    "famousVarietiesPl": [
      "Jun Shan Yin Zhen (Srebrne Igły z Wyspy Junshan)",
      "Meng Ding Huang Ya",
      "Huo Shan Huang Ya"
    ]
  },
  "tea-oolong": {
    "namePl": "Wulong (Oolong)",
    "nameEn": "Oolong Tea",
    "sensoryProfilePl": "Szczyt kunsztu herbacianego. Niezwykła rozpiętość: od świeżych, zielonych oolongów o aromacie bzu i orchidei (Tie Guan Yin, Ali Shan), po głęboko pieczone skalne Yan Cha (Da Hong Pao, Rou Gui) o nutach pieczonego chleba, miodu i mineralności.",
    "sensoryProfileEn": "The pinnacle of tea processing complexity. Ranging from light floral lilacs and orchid blossoms (Tie Guan Yin, Ali Shan) to deeply roasted mineral rock teas (Da Hong Pao, Rou Gui).",
    "descriptionPl": "Mistrzowie herbaty kontrolują oksydację poprzez mechaniczne obijanie brzegów liści na bambusowych tacach. Pozwala to na jednoczesne zachowanie świeżości wnętrza liścia i dojrzałości jego brzegów.",
    "descriptionEn": "Crafted through rhythmic bruising of leaf edges on bamboo trays. Balances the fresh vitality of green tea with the warm complexity of black tea.",
    "healthAttributesPl": "Połączenie polifenoli i kofeiny o zróżnicowanym profilu w zależności od stopnia prażenia.",
    "famousVarietiesPl": [
      "Da Hong Pao (Wielka Czerwona Szata)",
      "Tie Guan Yin (Żelazna Bogini)",
      "Dan Cong (Fenghuang)",
      "Dong Ding Oolong",
      "Ali Shan High Mountain"
    ]
  },
  "tea-black": {
    "namePl": "Czarna (Czerwona) Herbata",
    "nameEn": "Black Tea (Hong Cha)",
    "sensoryProfilePl": "W tradycji azjatyckiej zwana czerwoną (od rubinowego koloru likieru). Ciepłe nuty słodu, ciemnego miodu, czekolady, dojrzałych fig i drewna różanego. Indyjski Darjeeling dodaje nuty muszkatołowe, a Assam głębokie ciało.",
    "sensoryProfileEn": "Known as Red Tea in Asia for its radiant amber-ruby broth. Warming tones of barley malt, wild dark honey, cocoa nibs, dried figs, and muscatel grapes.",
    "descriptionPl": "Liście są w 100% utleniane enzymatycznie po intensywnym rolowaniu niszczącym ściany komórkowe. Klasyczny Zheng Shan Xiao Zhong z gór Wuyi dał początek światowej kulturze czarnej herbaty.",
    "descriptionEn": "Fully oxidized tea with leaves completely rolled to release enzymatic polyphenols. Originating in the Wuyi Mountains, it sparked worldwide tea trade routes.",
    "healthAttributesPl": "Zawiera charakterystyczne teaflawiny i tearubiginy powstałe w procesie pełnej oksydacji enzymatycznej.",
    "famousVarietiesPl": [
      "Zheng Shan Xiao Zhong (Lapsang Souchong)",
      "Keemun (Qimen Hong Cha)",
      "Dian Hong (Yunnan Red)",
      "Darjeeling First/Second Flush",
      "Assam CTC"
    ]
  },
  "tea-puerh": {
    "namePl": "Ciemna Herbata / Puerh",
    "nameEn": "Dark Tea / Puerh (Heicha)",
    "sensoryProfilePl": "Herbata żywa, dojrzewająca jak wino. Młody Sheng Puerh jest dziki, kwiatowy i taniczny; starzony Sheng nabiera nut suszonych śliwek, kamfory i skóry. Shou Puerh oferuje głęboki, gęsty napar o nutach ściółki leśnej, mchu, torfu i gorzkiej czekolady.",
    "sensoryProfileEn": "Living fermented tea that ages like vintage wine. Raw Sheng puerh starts brisk, floral, and tannic, evolving into camphor and sweet dried plums. Ripe Shou delivers rich forest floor, wet stone, and dark peat.",
    "descriptionPl": "Herbata poddawana fermentacji z udziałem mikroorganizmów (Aspergillus, drożdże). Puerhy z Yunnanu prasowane są w tradycyjne dyski Bing Cha (357g) lub cegły.",
    "descriptionEn": "Microbiologically post-fermented tea from large-leaf ancient Yunnan trees (Daye). Pressed into traditional 357g cakes (Bing Cha) or bricks for long-term aging.",
    "healthAttributesPl": "Herbata postfermentowana o unikalnym profilu mikrobiologicznym, tradycyjnie serwowana po obfitych posiłkach.",
    "famousVarietiesPl": [
      "Sheng Puerh (Raw Puerh z wiekowych drzew Gushu)",
      "Shou Puerh (Ripe Puerh)",
      "Anhua Heicha (Cegły Qianliang)",
      "Liu Bao Heicha"
    ]
  }
};
