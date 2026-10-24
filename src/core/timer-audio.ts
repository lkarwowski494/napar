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
import { getHapticsEnabled } from './database';

let soundInstance: AudioPlayer | null = null;

// Gentle short acoustic chime tone encoded as valid RIFF WAV with PCM samples (880Hz kitchen chime)
export const CHIME_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRhQLAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YfAKAACA2eCrhntaJCN20+GwiH1fKSFtzOO0in5jLh9kxeO5jH5oNB5bveO9jn9rOR5TtePCkYBvPx5MrOHGlIFyRB9FpN/Kl4F0SiE/m9zNm4J3TyQ5ktnQn4N5VCc0idTTo4R6WSowgM/VpoZ8Xi4td8rXq4d9YjIrb8TYr4l+ZjcpZ73Zs4t/ajwoX7bZt41/bkEoWK/Yu4+AcUYoUajXvpKBc0sqS6DVwpWBdk8rRpjSxZiCeFQtQZDPyJuDeVkwPIjLyp+Ee10zOYDHzKKFfGI3NnjCzqaGfWY7NHG9z6qIfmk/Mmq3z62Kf21DMmOxz7GMf3BHMVyqz7SOgHJMMlajzriQgXVQM1GczLuTgXdVNEyVyr6WgnlZNkeOx8CYg3pdOUSHw8Kcg3thPECAv8SfhH1lPz55u8aihn5oQjxytsalh35sRjtsscepiX9vSjpmq8esin9xTTpgpsavjIB0UTpboMWyjoF2VTtWmcS1kYF4WTxRk8K3k4J5XT5Njb+5loJ7YUBKhry7mYN8ZENHgLm9m4R9aEZFerW+noV+a0lDdLC/oYZ+bkxCbqy/pIh/cE9Baae/p4mAc1NBY6K/qouAdVZCX5y+rI2Ad1pCWpe9r4+BeV1EVpG7sZGBemFFU4u4s5SCe2RHUIa2tZaDfGdJTYCztpmEfWpMS3qvuJuFfm1PSnWruJ6Gf3BRSXCnuaCHf3JUSGujuaOIgHRYSGaeuKWKgHZbSGKZt6iMgHheSV6UtqqNgXlhSluPtKyPgXtkS1iKsq6RgnxnTVWFsK+Ugn1qT1OArbGWg35tUVF7qrKYhH5vVE92p7KbhX9xVk9yo7Odhn90WU5tn7Ofh4B2XE5pm7KhiYB3X05ll7GkioB5Yk9ikrCljIF6ZFBfjq+njoF7Z1Fcia2pkIJ8alNahKuqkoJ9bFRYgKirlIN+b1ZWfKasloR+cVlVd6OtmIR/c1tUc5+tmoV/dV1Tb5ytnIeAd2BTbJitnoiAeGJTaJSsoImAemVUZZCroouBe2dVYoyqo4yBfGpWYIiopY6BfWxXXoSmppCCfW5ZXICkp5KDfnFbWnyiqJODf3NdWXifqJWEf3RfWHWcqJeFf3ZhWHGZqJmGgHhjWG6VqJuHgHllWGuSqJyIgHpoWWiOp56KgXtqWWWLpZ+LgXxsWmOHpKGMgX1uXGGEoqKOgn5wXWCAoKOQgn5yX158nqORg390YF15nKSThH92Yl12maSVhH93ZFxzlqSWhYB5Zlxwk6SYhoB6aFxtkKOZh4B7al1rjaObiYF8bF5oiqGcioF9bl5mhqCdi4F9cGBlg5+ejYJ+cmFjgJ2fjoJ+dGJifZugj4N/dWRhepmgkYN/d2Vgd5agkoSAeGdgdJSglIWAeWlgcZGglYaAemtgb46gl4eAe21hbYyfmIiAfG5ha4memYmBfXBiaYadmoqBfnJjZ4Obm4uBfnNkZoCanIyCf3VlZX2YnI6Cf3ZnZHqWnY+Df3hoZHiUnZCDgHlqY3WSnZKEgHprY3OPnZOFgHttZHGNnJSGgHxvZG+KnJWHgH1wZG2Im5aIgX1yZWuFmpeJgX5zZmqDmJiKgX51Z2mAl5mLgn92aGh9lZmMgn93amd7lJqOg395a2d5kpqPg4B6bGd2kJqQhIB7bmZ0jpqRhIB8b2dyi5mShYB8cWdxiZmThoB9cmdvh5iUh4F+c2huhZeViIF+dWlsgpaWiYF/dmprgJWWioF/d2trfpOXi4J/eGxqfJKXjIJ/eW1peZCXjYOAem5pd46XjoOAe3BpdoyXj4SAfHFpdIqXkIWAfXJqcoiWkYWAfXNqcYaVkoaBfnVrcISVk4eBfnZrboKUk4iBf3dsboCSlImBf3htbX6RlIqCf3lubHyQlIuCf3pvbHqOlYyCgHtwbHiNlY2DgHxxbHeLlI6EgHxybHWJlI6EgH10bHSHlI+FgH51bHKGk5CGgH52bXGEkpGGgX53bnCCkZGHgX94bnCAkJKIgX95b29+j5KJgX96cG58jpKKgoB7cW57jZKLgoB7cm55i5KLg4B8c254ipKMg4B9dG52iJKNhIB9dW51h5KOhIB+dm50hZGOhYB+d29zg5CPhoF/eG9ygpCPhoF/eXBxgI+Qh4F/enFxfo6QiIF/e3JwfY2QiYKAe3Jwe4uQiYKAfHNweoqQioKAfXRweYmQi4OAfXVwd4eQjIOAfnZwdoaQjISAfndwdYSPjYSAfnhxdIOPjYWBf3lxdIGOjoaBf3pyc4CNjoaBf3pycn+MjoeBf3tzcn2Lj4iBgHx0cnyKj4iCgHx1cXuJj4mCgH12cXmIj4qDgH12cniHjoqDgH53cneFjouDgH54cnaEjouEgH95cnaDjYyFgH96c3WBjIyFgX96c3SAjI2GgX97dHR/i42GgYB8dXN9io2HgYB8dXN8iY2HgoB9dnN7iI2IgoB9d3N6h42JgoB+d3N5ho2Jg4B+eHN4hY2Kg4B+eXN3hIyKhIB/enR3goyLhIB/enR2gYuLhYF/e3V2gIqLhYF/fHV1f4qLhoGAfHZ1fomMhoGAfXZ1fYiMh4GAfXd0fIeMh4KAfnh0e4aMiIKAfnh0eoWLiIKAfnl1eYSLiYOAf3p1eIOLiYOAf3p1eIKKiYSAf3t1d4GKioSBf3t2d4CJioWBf3x2dn+JioWBgH13dn6IioaBgH13dn2HioaBgH14dnyGioaCgH55dnuGioeCgH55dnqFioeCgH96dnqEioiCgH96dnmDioiDgH97dnmCiYiDgH97d3iBiYmEgH98d3iAiImEgYB8d3d/iImEgYB9eHd+h4mFgYB9eHd9homFgYB+eXd9homGgYB+eXd8hYmGgoB+end7hImHgoB/end6g4mHgoB/e3d6g4mHg4B/e3d5goiIg4B/fHh5gYiIg4B/fHh5gIeIhIGAfXh4f4eIhIGAfXl4foaIhIGAfnl4foaIhYGAfnp4fYWIhYGAfnp4fISIhoGAf3t4fISIhoKAf3t4e4OIhoKAf3t4eoKIhoKAf3x4eoGHh4OAf3x4eoGHh4OAgH15eYCHh4OAgH15eX+Gh4SBgH55eX+Gh4SBgH56eX6Fh4SBgH56eX2Fh4WBgH57eX2Eh4WBgH97eXyDh4WCgH98eXyDh4aCgH98eXuCh4aCgH98eXuBh4aCgH99eXqBhoaDgIB9enqAhoaDgIB9enp/hoeDgYB+enp/hYeEgYB+e3l+hYeEgYB+e3l+hIeEgYB/e3l9hIeEgYB/fHl8g4eFgYB/fHl8goaFgoB/fHp8goaFgoB/fXp7gYaFgoCAfXp7gYaGgoCAfXp7gIWGg4CAfnt6f4WGg4CAfnt6f4WGg4GAfnt6foSGg4GAf3t6foSGhIGAf3x6fYOGhIGAf3x6fYOGhIGAf3x6fIKGhIGAf316fIKGhYKAf316fIGFhYKAgH17e4GFhYKAgH57e4CFhYKAgH57e3+EhYOAgH57e3+EhYOBgH58e36EhYOBgH98e36DhYOBgH98e36DhYSBgH98e32ChYSBgH99e32ChYSBgH99e3yBhYSBgIB9e3yBhYSCgIB+e3yAhYSCgIB+e3yAhIWCgIB+fHyAhIWCgIB+fHt/hIWDgIB/fHt/g4WDgYB/fHt+g4WDgYB/fXt+g4WDgYB/fXt9goWDgYB/fXt9goWEgYB/fXt9gYSEgYCAfnx9gYSEgYCAfnx8gISEgoCAfnx8';

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
  if (getHapticsEnabled()) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore in non-native / test environments
    }
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
  if (getHapticsEnabled()) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore in non-native / test environments
    }
  }

  // 3. Audio chime
  return await playTimerChime();
}
