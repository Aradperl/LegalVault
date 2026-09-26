import { useEffect, useRef } from 'react';
import { LAST_ACTIVITY_KEY } from '../apiService';

/** Client-side idle timeout. Easy to change; JWT can still last longer. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
] as const;

function readLastActivity(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

function writeLastActivity(ts: number): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {
    // e.g. Safari private mode
  }
}

/**
 * While `enabled` (logged in), logout after IDLE_TIMEOUT_MS with no
 * mouse / keyboard / touch / scroll. Cleans up listeners on logout/unmount.
 */
export function useIdleLogout(enabled: boolean, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    let timeoutId = 0;
    let lastRecorded = 0;

    const expireIfIdle = (): boolean => {
      const last = readLastActivity() ?? Date.now();
      if (Date.now() - last >= IDLE_TIMEOUT_MS) {
        onIdleRef.current();
        return true;
      }
      return false;
    };

    const schedule = () => {
      window.clearTimeout(timeoutId);
      const last = readLastActivity() ?? Date.now();
      const remaining = Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - last));
      timeoutId = window.setTimeout(() => {
        if (!expireIfIdle()) schedule();
      }, remaining);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < ACTIVITY_THROTTLE_MS) return;
      lastRecorded = now;
      writeLastActivity(now);
      schedule();
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!expireIfIdle()) schedule();
    };

    if (readLastActivity() == null) {
      writeLastActivity(Date.now());
    }
    if (expireIfIdle()) {
      return;
    }
    schedule();

    const listenerOpts: AddEventListenerOptions = { capture: true, passive: true };
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, listenerOpts);
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(timeoutId);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity, listenerOpts);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
}
