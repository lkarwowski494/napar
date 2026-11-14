// Przekazania roli 06 do 08 (M1-audytor-generalny-017, -018): wartości tylko z rejestru z przeczytanym źródłem.
jest.mock('expo-sqlite', () => require('./support/expo-sqlite-node').createExpoSqliteMock());

import { calculateRemainingCaffeineMg, DEFAULT_CAFFEINE_HALF_LIFE_H } from '../src/core/domain-rules';
import { calculateWaterMinerals } from '../src/core/water-chemistry';

test('[EFSA-T12-ZAKRES] domyślny czas półtrwania to średnia EFSA ok. 4 h (było 5 h)', () => {
  expect(DEFAULT_CAFFEINE_HALF_LIFE_H).toBe(4.0);
  expect(calculateRemainingCaffeineMg(100, 4)).toBeCloseTo(50, 5);
  const { getCaffeineHalfLife } = require('../src/core/database');
  expect(getCaffeineHalfLife()).toBe(4.0);
});

test('[BH-WATER-2016] sól Epsom: 2,45 g na 1 L = 1000 ppm GH, więc 100 ppm w 1 L = 0,245 g (było 0,2465)', () => {
  expect(calculateWaterMinerals(1, 100, 0).dryEpsomSaltMgSO4Grams).toBe(0.245);
});
