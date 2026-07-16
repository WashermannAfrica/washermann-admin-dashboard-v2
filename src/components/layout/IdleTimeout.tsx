'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TimerReset } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';

/**
 * Security idle-timeout for the admin dashboard.
 *
 * After IDLE_MINUTES with no activity, a warning modal opens with a live
 * WARNING_SECONDS countdown. "Stay signed in" resets the clock; letting the
 * countdown reach zero (or clicking "Log out") ends the session.
 *
 * Activity = pointer / key / scroll / touch, throttled to one write per
 * second. The last-activity timestamp is mirrored to localStorage so working
 * in one tab keeps every other admin tab alive too. Once the warning is
 * showing, only the explicit button resets — background mouse noise doesn't.
 */
const IDLE_MINUTES = 30;
const WARNING_SECONDS = 60;
const STORAGE_KEY = 'wm-admin-last-activity';

const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const WARNING_MS = WARNING_SECONDS * 1000;

export function IdleTimeout() {
  const logout = useAuthStore((s) => s.logout);
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());
  const warningRef = useRef(false); // mirror for event handlers

  const markActivity = useCallback(() => {
    if (warningRef.current) return; // during the warning, only the button resets
    const now = Date.now();
    // Throttle: at most one localStorage write per second
    if (now - lastActivityRef.current < 1000) return;
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      /* storage unavailable — single-tab tracking still works */
    }
  }, []);

  const endSession = useCallback(() => {
    logout();
    document.cookie = 'wm-admin-token=; path=/; max-age=0';
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.location.href = '/login?reason=idle';
  }, [logout]);

  const staySignedIn = useCallback(() => {
    warningRef.current = false;
    setWarning(false);
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    lastActivityRef.current = Date.now();

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));

    const tick = setInterval(() => {
      // Cross-tab: adopt the most recent activity from any admin tab
      let last = lastActivityRef.current;
      try {
        const stored = Number(localStorage.getItem(STORAGE_KEY));
        if (Number.isFinite(stored) && stored > last) {
          last = stored;
          lastActivityRef.current = stored;
        }
      } catch {
        /* ignore */
      }

      const elapsed = Date.now() - last;

      if (elapsed >= IDLE_MS) {
        endSession();
        return;
      }
      if (elapsed >= IDLE_MS - WARNING_MS) {
        warningRef.current = true;
        setWarning(true);
        setSecondsLeft(Math.max(0, Math.ceil((IDLE_MS - elapsed) / 1000)));
      } else if (warningRef.current) {
        // Another tab reset the clock while our warning was up
        warningRef.current = false;
        setWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
      clearInterval(tick);
    };
  }, [markActivity, endSession]);

  return (
    <Modal open={warning} onClose={staySignedIn} title="Are you still there?">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warn-bg text-warn">
            <TimerReset size={22} />
          </span>
          <p className="text-sm text-body">
            You&apos;ve been inactive for a while. For security, you&apos;ll be signed out in{' '}
            <span className="font-bold tabular-nums text-ink">{secondsLeft}s</span> unless you continue.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={endSession}>
            Log out
          </Button>
          <Button className="flex-1" onClick={staySignedIn}>
            Stay signed in
          </Button>
        </div>
      </div>
    </Modal>
  );
}
