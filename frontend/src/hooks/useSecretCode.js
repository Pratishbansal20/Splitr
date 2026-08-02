import { useEffect, useRef } from 'react';

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

// Listens globally for the Konami code and calls `onUnlock` when it's typed.
// This is the "secret" trigger for the hidden theme — no visible UI hint.
export function useSecretCode(onUnlock) {
  const buffer = useRef([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      buffer.current = [...buffer.current, e.key].slice(-KONAMI.length);
      if (buffer.current.length === KONAMI.length && buffer.current.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase())) {
        buffer.current = [];
        onUnlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock]);
}

// Mobile/no-keyboard fallback: N rapid taps on an element (e.g. the logo)
// within a short window triggers the same callback.
export function useTapCode(onUnlock, { taps = 5, windowMs = 1500 } = {}) {
  const tapTimes = useRef([]);

  const registerTap = () => {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].filter((t) => now - t < windowMs);
    if (tapTimes.current.length >= taps) {
      tapTimes.current = [];
      onUnlock();
    }
  };

  return registerTap;
}
