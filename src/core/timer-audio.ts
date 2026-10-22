// ============================================================================
// Napar (Steepwise) — Timer Audio & Haptic Chime Engine (Zadanie N4)
// Plays an acoustic chime tone, triggers haptic cues, and announces VoiceOver
// on 3-second step warning and stage completion.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { announce } from './announce';
import { getCurrentTranslations } from './i18n';

let soundInstance: AudioPlayer | null = null;

// Dzwonek akustyczny A4 440 Hz (z harmonicznymi 880 i 1320 Hz, zanik 0,6 s) zapisany jako RIFF WAV, PCM 16-bit mono 8 kHz
export const CHIME_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRqQlAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YYAlAAAAANEAvwKuBM0FCgazBdMEGQNMAL/8/fgw9fjwVuzG6DDpEvAx/dkMxRlOIGAgnhyyF04SggusArX4Lu+U5uzdx9S6zVPOf9vu9JcTSS2/Onw7JjP4KOoezBOFBjT4I+s94EPWMcxdxKvEkNLj7SsPYiuKOtc7czRsKnggxhX+CNP6hO1e4nLYb87pxULEYM9k6BcJuSZgOOY7pjXcK/khoxdeC2397e+A5JTartCpx0vEucxC4wMDuiHENaE7tzZHLW8jZhmkDQAAYPKn5qzc59KPybvEnMqK3gT9dBy3Mv86nTeqLt0kEBvND4cC2fTV6LzeGNWTy4XFBMlG2if39RY9L/o5UTgBMEYmpRzaEf4EVvcK68bgPteozZ/G7cd81oDxTBFaK404yThIMaonJx7JE2MH1PlI7cziV9nIz/vHUMcz0x7sigsYJ7U2/Th6Mgopmx+cFbIJUfyP79PkZdvs0Y7JI8ds0A7nwAV/InA05DiOM2YqBCFVF+gLyP7f8d3maN0M1EzLXscozl3iAACbHb8xdjh/NLsrZCL2GAQONQE29OzoYd8m1inN9cdlzBbeWvp6GKMurjdDNQgtvSOBGgUQlgOT9gLrVOE32B3P3cgfy0Ha3vQpEyIrhTbSNUguEiX5G+oR5gXy+CDtQuM82h/RCspQyuPWne+5DUEn9zQlNnUvYyZhHbQTIwhR+0bvMOU13CfTcMvyyQDUo+o5CAkjAzMzNoswsCe9HmMVSQqs/XXxHuck3i/VBc36yZrR/+W6AoUepjD0NYIx+CgQIPsWVwwAAKzzEekJ4DLXvs5fyrDPuuFM/b8Z5C1hNVIyOSpbIXwYTA5JAuj1Cevm4S3ZkNAWy0DO3d3/98YUvip1NPUycCuhIusZJxCFBCn4Ce2+4x/bc9IVzEPNcNri8qcPOicrM2IzmCzjI0kb5xGvBmv6EO+U5QXdX9RQzbXMdtcC7nEKXyOAMZAzrC0iJZkcjhPGCKv8IPFq5+HeTta8zo3M89Ru6TQFNh9zL3ozpi5dJt8dHRXGCub+N/NC6bLgO9hQ0MLM5tIv5QAAyhoDLRczgC+SJx4flhavDBgBVfUe63ziItoA0krNTtFQ4eT6JRYzKmIyMTC/KFYg+xd+Dj4DePcB7T/kANzE0xzOJ9DY3e71VhEHJ1UxszDgKYshTxk1EFYFnvnr7v/l1N2V1S3PbM/M2izxawyFI+0v/jDxKrsilhrUEVwHw/ve8L3nnd9r13HQF88w2KzscQe0HyguCjHsK+kj0BtaE08J5f3X8n3pXeFC2d/RHs8F1njodwKdGwUs0TDLLBIlAx3LFCsLAADY9EDrFOMU227Tec9J1Jvkjv1MF4YpTTCILTQmLh4oFvAMEQLe9gjtxOTf3BPVH9D80h3hwvjMEq0mdy8bLk0nVh9zF50OFwTo+Nfub+ah3snWBtEX0gPeIfQpDn4jTS5+LlkoeSCwGDMQDAbz+q3wGOhZ4IbYI9KX0VLbue9zCQEgyiyoLlMpmiHhGbIR8Af8/IrywekI4kbabdNy0QzZlOu1BD4c7yqULjYqtiIIGxoTwAkB/2/0bOut4wTc2dSi0THXvecAAD0Yuig6LvoqziMoHHAUegv9AFn2G+1L5bzdYdYe0sDVPORg+woULyaWLZsr3iRCHbMVHQ3vAkj40O7j5m3f+tfc0rXUGOHj9rAPUCOjLBEs5CVZHucWqg7UBDn6jPB46BThntnS0wzUV96V8jwLIyBdK1Qs2yZtHw4YIRCpBir8TvIM6rLiSNv41L7T+tuD7rsGrxzEKWAsvid+ICsZgxFsCBj+GPSh60fk8txD1sXTA9q16jsC/BjVJywsiCiLIUAa0BIbCgAA6PU57dTlmN6s1xjUctg358r9FBWSJbQrMymSIk8bDBS1C98BvffW7lvnN+Ap2a7URNcN5HP5AhH+IvMquCmQI1ocOBU5DbMDlfl58N7ozuG12n7VdtY/4UL10AweIOUpESqCJGIdVxaoDnkFbvsi8l7qXONI3IDWAdbP3kXxjAj2HIcoNypkJWceahcCEC8HRv3S89/r4uTd3avX4NXB3IXtQgSOGdkmJSoxJmkfdRhJEdIIGf+J9WHtX+Zx3/XYDNYT2wzqAADuFdok1CnjJmYgehl+EmIK5QBE9+fu1uf/4FfafNbF2eHm0fsiEo0iQCl1J1whehqiE94LqAIE+XPwR+mH4snbJ9fU2AnkwfcyDvQfZCjfJ0kidhu5FEUNXgTG+gTytuoG5EbdBtg72Ivh3PMqChQdPSccKCgjcBzEFZgOBwaI/JzzI+x85cfeENn012jfLfAXBvQZyiUnKPYjZh3GFtgPnwdH/jr1ke3r5kjgPNr616HdvOwFApwWCiT4J60kWR7AFwYRJAkAAN72A+9S6MbhgttF2DbckukA/hMT/yGLJ0clRx+2GCQSlwqxAYb4ePC06T3j29zN2CXbtuYS+mMPqh/dJsAlLiCnGTMT9wtZAzH68/ER667kQd6K2WraLORI9pgLDx3oJRAmCSGWGjYUQw30BN37dPNt7Bbmrt9z2gDa+OGs8rwHNBqsJDMm1SGCGzAVfA6ABoj9+/TJ7XfnHeGB2+PZG+BI79sDHxcmIyImjyJrHCEWpA/7By//iPYn78/oiuKs3Aral94j7AAA2BNYIdklMCNQHQ0XuxBlCc8AGfiI8CLq8+Ps3W/aaN1F6Tf8aBBDH1MlsyMvHvUXxBG9CmcCrvnu8XHrVeU73wvbjtyz5or42AzpHIwkFCQGH9kYwBICDPQDRftZ87zsr+aU4NTbBNxx5AT1MwlQGoEjSyTQH7sZshM1DXQF3PzK9AfuAujw4cXcxNuC4q7xgwV8FzEiVCSKIJoamxRWDuUGcf5B9lPvTulN49Tdydvm4JLu1AF1FJwgKiQvIXYbfhVnD0YIAAC896Hwk+qm5PveDdye37XrMf5CEcMeyCO7IU0cXBZqEJUJiAE8+fPx0+v65TTgiNyn3h7po/rsDaYcKiMoIh4dNhdfEdMKBwO/+knzD+1I53fhM93+3dLmNfd+CksaTSJxIuQdDhhKEgAMewRC/Kb0Su6O6MHiBt6e3dTk8fMAB7YXLiGQIp0e5BgrExsN4QXE/Qf2he/M6Q3k+t6D3STj3/B9A+wUzh+BIkUftxkGFCcOOQdD/273wfAE61jlCeCn3cXhB+4AAPURLB4/ItcfhhrbFCMPgAi7ANr4AfI37J7mKuEC3rPgbuuT/NgOSRzFIU4gUButFRMQtwksAkj6RfNm7d7nWuKP3u7fG+lA+Z8LKRoRIaUgEhx8FvcQ3QqUA7n7jfSS7hjpkeNG33DfEOcQ9lMIzxcgINcgyRxIF9IR8wvvBCn92/W970vqzOQf4DffUOUL8/0EQBXwHt8gcR0SGKUS+Qw9Bpf+Lvfp8HfrCOYV4Tzf3OM68KcBghKCHbkgBx7ZGHIT8A18BwAAhvgX8p3sQOcg4nnfs+Kj7V3+ng/VG2AghR6cGTsU2g6sCGMB4flJ877tdOg64+jf0+FM6yX7mQzsGdEf6B5YGgEVuA/MCb0CP/t/9N3uoulf5IPgOuE46Qv4fgnLFwkfKh8MG8QVjBDcCg4Enfy69frvyeqK5ULh5OBq5xf1VQZ0FQYeRh+zG4YWWBHcC1IF+/369hbx6eu25h/iy+Dj5VDyKAPuEsccOR9LHEUXHhLODIkGVf8/+DXyBO3h5xPj7OCl5L3vAAA/EE0b/R7PHAAY3xKzDbEHqQCI+VbzGe4I6RrkPuGu42Tt5/xuDZgZjx47HbcYnROLDsoI9wHU+nv0K+8q6izlvuH74knr5PmECqwX7B2KHWYZWBRaD9QJPAMh/KT1OvBG60bmY+KK4nDpAveIB4sVER23HQsaERUgENAKdwRu/dL2SfFc7GPnKONW4tvnR/SDBDoT/xu+HaQayBXfEL0LpQW5/gX4WfJr7YHoBuRa4ormu/F/Ab8QsxqcHSsbfBaYEZwMxgYAADz5avN17pvp+OSR4n3lY++F/iEOLxlLHZ4bLBdOEnAN2QdBAXb6f/R777Lq9+X24rLkRO2c+2YLdRfKHPcb1hcBEzkO3Qh7ArP7l/V+8MPrAOeC4yjkY+vN+JcIhxUVHDMceRiyE/kO0wmrA/D8tfaA8c7sD+gv5Nrjwekh9rsFaRMqG0wcEBlhFLIPuwrQBCz+1veC8tPtHun35MTjYOid89sCIREKGkAcmhkOFWUQlgvpBWX//PiF89LuLerU5eHjQOdJ8QAAsw60GAocERq3FRMRZQz2BpkAJvqK9M3vOOvB5izkYOYp7zL9JwwpF6YbcxpcFr8RKQ30B8cBUvuT9cXwPuy655/kvuVC7Xn6hAlrFRMbuhr7FmgS5A3lCO4Cf/yh9rvxP+256DTlV+WW69330AZ+E00a4xqRFw8Tlw7ICQoErf2y97DyOu676eblKOUn6mX1FQRmEVUZ6hobGLUTRA+fChsF2P7H+KXzMO+96q/mLOX26BbzWgEnDygYyxqVGFgU7A9pCyEGAADh+Z30IfC964rnXuUD6Pfwqf7JDMoWghr9GPcUkBApDBkHIgH9+pf1DvG57HLouuVM5w3vB/xQCjkVDRpOGZIVMhHeDAUIPgIc/JX2+PGw7WHpOObO5lntffnFB3oTaRmEGSUW0hGMDeQIUgM7/Zf34fKh7lbq1eaI5t/rEfcvBZARlRibGa4WcBIzDrYJWwRZ/p34y/OO70zried05p/qy/SVAoAPkBeQGSoXDRPVDnwKWQV0/6f5tfR18EHsUuiO5pvpr/IAAE0NWhZfGZYXphNzDzcLTAaLALT6ovVY8TLtKOnS5tDow/B3/f8K9BQEGe4XPBQPEOgLMgecAcT7kfY48iDuCeo65z7oCu8A+5wIYRN/GC8YyxSoEJEMDAimAtX8hfcW8wjv8OrB5+Hnh+2j+CoGoxHMF1QYUxU/ETMN2gioA+X9fPj08+vv2eti6LbnO+xn9rIDvg/rFloYzxXVEdANnAmfBPX+d/nS9Mnww+wY6brnJ+tR9DkBtg3cFT4YPhZoEmgOUwqLBQAAdvqy9aPxq+3e6efnS+pm8sr+kQueFPwXnBb4Ev0OAAtsBgcBd/uV9nryj+6w6jropemq8Gj8VQk0E5IX5RaEE48PpQtCBwcCevx7907zbu+J66zoNOkf7xv6CAegEf4WFhcJFCAQQgwLCAEDfv1k+CH0SfBm7Drp9OjJ7ev3sQTkDz4WKxeFFK8Q2QzJCPEDgf5R+fT0HvFE7d7p4uio7Nz1VgIGDlIVIRf2FD0RbA18CdcEgv9C+sj18PEi7pPq+ui86/TzAAAJDDkU9BZXFccR+w0mCrMFfQA1+572vfL87lXrN+kF6zfytP3zCfYSoxanFU8Shw7GCoMGdQEr/Hf3iPPT7yDslumB6qfwevvKB4kRKhbiFdESEg9fC0gHZgIi/VT4UfSl8PHsEOot6knvV/mUBfUPiRUDFksTmw/yCwIITgMZ/jP5GvVz8cTtouoG6h3uUfdYAz4OvRQJFrwTIhB/DLIILgQO/xf64/U88pjuRusJ6iPtbvUbAWgMxxPvFSAUqBAJDVgJBAUAAP36rfYB82nv+esy6lzssfPn/ncKqBK0FXUUKhGPDfQJ0AXuAOb7evfD8zjwt+x96sbrH/K//HIIYBFUFbcUqREUDokKkQbWAdD8SviD9ALxe+3l6l/ru/Cr+l0G8g/OFOQUIRKXDhcLRwe3Arv9HflC9cjxQ+5l6ybrhe+w+D4EYQ4gFPcUkRIZD6AL8weRA6X+9PkB9onyDe/56xXrf+7T9h0CsAxKE+0U9xKZDyUMlQhhBI7/zvrB9kbz1e+d7Cvrqu0Z9QAA5ApNEsUUTxMWEKYMLgkoBXEAqvuD9wD0m/BM7WLrBO2G8+z9AQkoEXsUmBORECUNwAnkBVEBiPxH+Lj0XfEE7rjrjOwd8uj7DAfeDw4UzBMGEaMNSgqXBisCaP0P+W71HPLB7ibsQOzg8Pn5DAVxDnwT6xN1ER8Ozwo/B/4CR/7Z+SP21vKB76rsHezR7yT4BgPjDMQS8BPbEZkOTwveB8gDJf+n+tn2jPNA8D/tIOzv7m/2AAE6C+UR2RM2EhIPywt0CIoEAAB3+5D3PvT98OHtRuw77t30Av94CeEQoxODEogPRQwCCUIF1wBK/Er47vS48Y3uieyz7XHzD/2kB7kPTBO/EvoPvQyICfEFqQEe/Qb5m/Vv8j7v5+xW7S/yLfvCBW4O0xLnEmcQNA0JCpYGdQLz/cX5SPYi8/TvW+0i7RbxYvnXAwMNNhL4Es0QqQ2FCjEHOgPG/of69fbR86rw4e0T7Srws/fqAXsLdBHwEikRHQ79CsQH9gOZ/0z7ovd89F/xde4m7WnvI/YAANoJjxDLEnkRjg5yC08IqgRnABT8Uvgl9RLyFO9Z7dPutvQf/iUIhg+IEroR/Q7lC9IIVQUxAd38A/nL9cLyu++m7WbucPNM/GAGWw4mEuoRZw9WDE8J9gX2Aaf9uPlv9m7zZvAK7iLuUfKM+pEEEQ2hEQYSzA/HDMcJjwa1AnH+b/oT9xb0E/GB7gLuW/Hk+LwCqQv7EAoSKBA2DTsKHgdsAzr/Kfu497v0wPEI7wXuj/BY9+gAKAoxEPURehCjDawKpgcbBAAA5vte+Fz1a/Kb7ybu7O/s9Rr/kghGD8QRwBAODhoLJgjCBMIApPwG+fv1FPM28GPuce+j9Fb96gY6DnYR9hB1DocLoAhgBYEBZP2w+Zj2uvPX8LjuHe9/86L7NQUODQgRGhHYDvILFQn1BTkCJf5d+jX3XPR78SHv7e6C8gP6eQPGC3oQKhE0D1wMhQmCBusC5P4N+9H3+vQf8prv4O6s8X34uwFjCssPIhGHD8UM8QkHB5YDov+/+274lfXD8iHw8u798BP3AADqCPsOARHPDywNWwqEBzgEXQBz/A35LfZl87DwH+918Mn1Tf5fBwwOxRAKEJANwwr7B9MEFAEp/a75w/YF9EfxZe8T8KL0pvzFBf0MaxA2EPANKgtsCGUFxgHg/VH6WPeg9OLxwO/V757zEfsiBNIL9A9PEEsOjwvZCO8FcwKX/vf67fc59X7yLPC478Dykfl6Ao0KXQ9TEJ8O9AtCCXEGGQNN/5/7gvjO9RvzpvC77wfyK/jSADEJpw5AEOkOVwyoCewGtwMAAEr8GPlg9rbzKvHZ73Px4vYw/8EH0g0UECgPtwwMCmAHTgSwAPb8sPnv9k/0t/EQ8ATxuPWX/UEG3wzMD1kPFQ1uCs4H3QRcAaT9Svp+9+X0SPJd8LjwsPQN/LYE0AtpD3kPbg3PCjcIZAUDAlL+5voL+Hf13PK88I3wy/OV+iUDpwroDogPwQ0vC50I4wWkAv/+hfuY+Ab2cfMq8YHwCfM0+ZEBZglKDoEPDQ6OC/8IXAY+A6v/J/wn+ZP2BvSj8ZHwa/Lt9wAAEQiODWMPTg7rC18JzQbSA1QAyvy2+Rz3mfQl8rrw8PHC9nb+qwa1DCwPhA5FDL0JOQddBPoAb/1I+qT3KfWu8vrwl/G39fj8OAXBC9sOqw6dDBoKnwfhBJsBFP7b+iv4tfU680zxX/HM9In7vQOyCm8OwQ7vDHYKAQheBTcCuv5x+7L4P/bH863xRfED9C76PQKMCecNxQ46DdAKYAjUBc0CXv8K/Dj5xvZV9BzyR/Fb8+r4vgBRCEINtA5+DSoLvQhDBl0DAACk/MD5Svfi9JTyY/HW8sD3RP8EB4EMjA62DYELFwmsBuUDnwBA/Ur6zPds9RPzlfFx8rP20v2pBaYLTA7jDdYLcAkQB2YEOwHd/dX6Tfjz9Zbz2vEt8sT1bfxEBLAK8g0ADicMyAlvB+EE0gF7/mP7zfh49hz0MPIG8vT0GfvYAqMJfQ0NDnIMHgrLB1QFZAIY//P7Tfn59qP0k/L78UX02vlrAYEI7gwHDrYMdAokCMEF7wKz/4T8zvl49yr1AfMJ8rbzsvgAAE0HRAzsDfIMyAp7CCcGdANMABj9T/r19671d/Mu8kfzo/ec/gkGgAu7DSINGgvQCIkG8wPiAK390/pw+DH28vNo8vbysfZC/bkEogpxDUUNaQskCeUGagR0AUP+Wfvq+LD2cfSy8sPy3fX2+2IDrgkPDVoNtAt3CT4H2wQBAtn+4Ptk+S338fQK86zyJ/W8+gcCowiUDF0N+AvJCZQHRgWJAm3/avze+af3cfVu867yj/SX+awAhgf/C04NNQwaCugHqgULAwAA9vxZ+h748PXb88fyF/SJ+Fb/WQZRCykNaAxpCjkICQaGA5AAg/3V+pT4bvZO9PTyvPOV9wf+HwWKCu8MkAy2CooIZAb7Ax0BEf5T+wn56PbF9DPzffO99sT83AOsCZ4Mqwz/CtkIugZqBKYBoP7T+3z5YPc+9YHzWvMB9pH7kwK5CDUMtwxDCygJDQfSBCkCLv9V/PD51fe49drzUPNj9XD6SAGyB7MLsQyBC3UJXQc0BagCu//Z/GX6SPgy9j70XfPh9GT5AACbBhkLmQy2C8IJrAeRBSADRQBf/dr6ufiq9qj0f/N99G/4vv52BWgKbAziCwwK+QfpBZMDzADm/VH7KPkg9xj1s/M09JT3hf1GBJ8JKgwCDFMKRQg9Bv8DUQFt/sr7l/mT94v19vMG9NT2WPwPA8II0QsUDJYKkAiOBmUE0AH1/kX8BfoE+P/1RvTx8y/2PPvVAdEHYQsYDNQK2wjbBsUESwJ7/8L8c/py+HP2oPTy86b1M/qbAM8G2woJDAsLJAknByAFwQIAAED94vre+Ob2A/UJ9Dn1P/lm/74FPQrpCzoLawlxB3YFMAOCAMD9U/tJ+Vf3a/Uy9Of0Yvg3/qIEiQm0C14LsQm6B8gFmgMCAUH+xfuy+cb31vVr9K70n/cT/X4DwAhqC3cL8wkCCBYG/gN9AcL+Ofwb+jL4RPax9I709fb9+1QC5AcLC4ELMApJCGEGXQT1AUL/r/yE+pz4s/YC9YX0Zfb3+ikB9gaWCnwLaAqPCKoGtgRnAsH/Jv3t+gT5Ifdc9ZH08PUF+gAA+gULCmYLmQrUCPEGCgXUAj4An/1Y+2r5jfe99bD0lfUo+dz+8QRqCT0LwAoXCTcHWQU8A7kAGf7D+8/5+Pci9t/0U/Vh+MH93gO1CAEL3QpYCXwHpQWdAzABlP4x/DP6YPiJ9hv1KvWz97H8xQLsB7EK7gqUCcAH7gX6A6QBDv+g/Jf6xvjy9mT1FvUe97D7qQESB0wK8QrNCQMINAZRBBMCiP8R/fr6Kvlb97X1GPWi9sD6jAApBtIJ5Ar+CUUIeQajBH0CAACD/V/7jPnD9w72LfU/9uT5df8yBUMJxwooCoYIvAbxBOMCdgD3/cX77fkq+G32UvX19Rz5Y/4xBKEIlwpJCsUI/QY7BUID6QBr/iz8TPqO+M72hfXC9Wv4Wv0pA+sHVApfCgAJPweCBZ0DWQHg/pX8q/rw+DH3xfWl9dH3X/wbAiQH/glpCjgJfwfGBfIDxQFU/wD9CvtQ+ZX3Dvad9U/3cvsNAU0GlAlkCmsJvgcIBkMELALH/2z9afuu+fn3YPao9eX2lvoAAGgFFglQCpcJ/QdIBo8EjwI4ANn9yfsL+lv4t/bD9ZP2zvn4/ngEhQgsCroJOgiHBtcE7QKnAEj+K/xm+rz4Evfu9Vf2G/n4/YAD4Qf1CdUJdAjFBhwFRQMTAbb+jvzA+hr5cPcl9jL2fvgC/YECKwetCeQJqwgDB14FmQN8ASX/8vwa+3f5z/dm9iD29/cZ/IABZgZRCeYJ3ghAB50F6APhAZT/WP11+9H5Lviw9iL2h/dA+38AkwXjCNsJCwl8B9sFMgRBAgAAwP3Q+yn6jPgB9zT2Lfd5+oL/tARiCMAJMQm2BxgGeQScAmoAKP4s/IH66fhW91b26vbE+Yr+ywPOB5UJTwnvB1MGvATzAtMAkv6J/Nf6RPmu94T2vPYk+Zv93AIqB1kJYwklCI4G/ARFAzgB+/7o/C37nfkI+L72ovaZ+Lf86AF2BgsJawlYCMgGOQWSA5oBZf9J/YP78/lj+AD3mvYj+OH78wCzBasIZwmFCAIHdQXbA/cBzf+r/dn7SPq9+Er3pPbD9xr7AADkBDkIVQmtCDoHrwUgBFECMwAO/jD8nPoV+Zn3vfZ592X6Ef8LBLUHNAnNCHEH6AVhBKUClwBx/oj87vpt+ez34/ZD98P5Kf4qAyEHAwnlCKYHIAafBPYC+QDW/uL8QPvC+UH4Ffch9zX5S/1EAn0GwQjzCNgHWAbbBEEDWAE6/z39kvsW+pf4UPcR97v4ePxcAcoFbgj1CAYIjwYUBYkDswGe/5n95Pto+u34k/cS91X4tPtzAAsFCgjrCC8IxQZMBcwDCgIAAPf9Nvy4+kL53Pcj9wT4//qO/0EElQfSCFEI+gaDBQwEXQJgAFX+ifwH+5b5KfhB98f3XPqu/m8DEAerCGwILge5BUgEqwK/ALX+3vxV++j5efhr9533y/nV/ZYCfAZ1CH4IXwfuBYIE9QIaART/NP2i+zj6yvif94b3TfkH/bkB2AUuCIYIjAcjBroEOwNzAXP/i/3w+4f6HPnc93/34/hF/NwAKAXXB4IItgdXBvAEfQPHAdL/4/0+/NT6bvke+Ij3jPiS+wAAbQRwB3II2geKBiQFuwMYAi4APf6N/B/7vvlm+J/3SPju+ij/qQP5BlQI9we8BlgF9gNlAokAl/7d/Gr7Dfqx+MH3GPhb+lb+3QJzBicIDAjsBosFLwStAuEA8v4u/bT7Wvr9+O73+ffa+Y39DQLfBewHGQgZB70FZQTyAjcBTf+A/f77pvpL+ST46/ds+c78OgE9BaEHGwhCB+8FmQQzA4kBp//U/Uj88PqZ+WD47PcQ+R38aACQBEYHEQhnByAGywRvA9gBAAAo/pL8OPvm+aL4+/fH+Hn7mf/ZA90G+weGB1AG/QSpAyMCVwB+/t78gPsy+uj4FviP+OX6zv4bA2QG2AefB38GLgXgA2oCrQDU/ir9xvt8+jD5Pfhq+GL6Cv5XAt4FpwevB6sGXgUUBK0CAAEr/3j9DfzF+nr5bPhU+PD5UP2PAUoFZwe2B9QGjQVHBOwCTwGB/8f9U/wM+8T5ovhO+JD5oPzHAKsEGAezB/oGvAV3BCgDnAHW/xf+mvxS+w763vhW+EL5/vsAAAEEuwakBxoH6wWnBGAD5QEpAGj+4fyW+1b6H/lr+AT5afs9/1ADTwaJBzUHGAbWBJYDKwJ8ALr+Kf3a+576Y/mK+Nj45fp//pcC1gVgB0gHQwYEBckDbALMAAz/cv0d/OT6qPmz+Lz4cPrJ/dsBUAUrB1MHbAYxBfkDqgIZAV7/vf1f/Cj77/nj+LD4DPoc/RwBvQTnBlUHkQZfBSkE5QJkAbD/Cf6i/Gv7Nfoa+bH4ufl7/F4AIQSVBk0HswaLBVYEHAOrAQAAVf7m/K37e/pW+b74d/no+6P/fAM1BjkHzwa2BYMEUAPvAU8Ao/4q/e77v/qV+df4Rfli++v+zwLIBRkH5QbgBa8EgQMvApwA8f5v/S38A/vW+fr4I/nr+jr+HgJPBewG9AYJBtsEsQNsAucAP/+2/W38RfsZ+iT5D/mE+pH9aQHJBLMG+gYuBgYF3gOlAi8Bjf/9/a38hftc+lb5Cvkt+vL8tAA5BGsG9wZQBjEFCwTbAnUB2v9G/uz8xPuf+oz5Efnm+V/8AACgAxcG6gZtBlsFNgQOA7cBJQCP/i39Avzg+sf5JPmv+dn7T///ArYF0QaFBoMFYAQ+A/YBcADZ/m79P/wh+wT6QPmH+WH7o/5YAkgFrQaXBqoFigRsAzECuAAj/7H9e/xh+0P6Zflt+fj6//2uAc4EfAahBs8FswSZA2kC/wBu//T9uPye+4L6kfli+Z36Y/0BAUoEPwajBvEF3ATDA54CQgG3/zn+9Pzb+8L6wvlj+VL60fxVALwD9QWbBhAGBAXtA9ACggEAAH7+Mf0W/AH7+Plv+Rb6S/ys/ycDngWJBikGKwUVBP8CwAFHAMT+b/1R/D/7MfqG+en50vsG/4sCOwVsBj0GUQU9BCwD+gGNAAv/rv2L/Hz7bPql+cr5Z/tl/uoBzQREBkoGdQVlBFcDMQLRAFH/7f3E/Lj7qfrL+bj5CvvM/UcBVAQPBlAGlwWMBIADZQITAZj/Lv7+/PL75fr4+bT5u/o9/aMA0gPPBU0GtgWyBKgDlQJRAd7/cP43/Sv8Ivsp+rr5e/q4/AAARwODBUEG0QXYBM8DxAKNASIAsv5y/WP8Xfte+sv5Sfo+/GD/tgIqBSsG5gX9BPUD7wLGAWUA9f6t/Zr8mPuW+uT5JfrS+8X+HwLHBAoG9gUYBQ4ECgPvAaIAQP8A/vr8Dfwi+2/6gPrR+1j+YAHqAz4FUwWiBLgD1ALiAcUAkP9w/oP9tfzn+zz7I/sS/Bz+uQAOA2oEpwQiBFoDkwLHAdkA0P/T/gH+Tv2f/AP80Ptv/AX+NABIApoD9QOZA/MCSQKfAd0AAAAo/3L+2/1K/cP8g/zk/BP+1f+aAdQCQAMIA4MC9gFsAdIAIQBw/9f+W/7o/Xn9OP1r/UH+mf8JARoCiwJvAgsCmwEvAboAMwCp/zD/z/54/iT+6/0A/oz+gf+VAHAB1wHQAYsBNwHoAJUANgDU/3z/N//8/sP+mf6e/u/+iv9CANsAKgEtAQMBzACYAGQAKwDx/7z/lP90/1b/QP9B/2j/tP8QAF4AhgCIAHMAWAA/ACkAEwD//+7/5P/f/93/3//l//H//P8=';

/**
 * Plays the acoustic chime tone safely and disposes resources on completion.
 */
export async function playTimerChime(): Promise<boolean> {
  try {
    if (soundInstance) {
      try {
        soundInstance.remove();
      } catch {
        // Ignoruj błąd rozładowania
      }
      soundInstance = null;
    }

    const player = createAudioPlayer(CHIME_AUDIO_DATA_URI);
    player.play();
    soundInstance = player;

    const cleanup = () => {
      try {
        player.remove();
      } catch {
        // safe fallback
      }
      if (soundInstance === player) {
        soundInstance = null;
      }
    };

    if (typeof (player as any).addListener === 'function') {
      try {
        const sub = (player as any).addListener('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish) {
            cleanup();
            if (sub && typeof sub.remove === 'function') {
              sub.remove();
            }
          }
        });
      } catch {
        // fallback
      }
    }

    setTimeout(cleanup, 1500);
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggered at 3 seconds before step end (Apps4Brew T-014 / BR-ZEG-002).
 */
export async function notifyTimerStepWarning(secondsLeft = 3): Promise<boolean> {
  // 1. Accessibility announcement (i18n localized)
  const t = getCurrentTranslations();
  const template = t.common.timerStepWarning || 'Pozostały {seconds} sekundy do końca zalania';
  announce(template.replace('{seconds}', String(secondsLeft)));

  // 2. Haptic warning
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Ignore in non-native / test environments
  }

  // 3. Audio chime
  return await playTimerChime();
}

/**
 * Triggered when a timer step or entire session finishes.
 */
export async function notifyTimerFinished(stepName?: string): Promise<boolean> {
  // 1. Accessibility announcement (i18n localized)
  const t = getCurrentTranslations();
  const message = stepName
    ? (t.common.stepFinished || 'Krok ukończony: {step}').replace('{step}', stepName)
    : (t.common.brewingFinished || 'Parzenie zakończone!');
  announce(message);

  // 2. Haptic success
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore in non-native / test environments
  }

  // 3. Audio chime
  return await playTimerChime();
}
