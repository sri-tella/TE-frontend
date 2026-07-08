import { useEffect, useRef } from 'react';

export function useDevAutofill(autofillFn) {
  const fnRef = useRef(autofillFn);
  fnRef.current = autofillFn;

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'B') {
        e.preventDefault();
        fnRef.current?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
