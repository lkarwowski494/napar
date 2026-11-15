// M1-audytor-generalny-034 (09-lokalizacja-004): domyślny system jednostek z regionu urządzenia.
// expo-localization: measurementSystem 'us' → imperialny (°F, oz); 'metric' i 'uk' → metryczny.
import { getLocales } from 'expo-localization';

export function regionUnitSystem(): 'metric' | 'imperial' {
  try {
    return getLocales()[0]?.measurementSystem === 'us' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}
