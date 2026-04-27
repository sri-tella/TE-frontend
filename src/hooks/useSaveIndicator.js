import { useState, useCallback, useRef } from 'react';

export const useSaveIndicator = () => {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);

  const flash = useCallback(() => {
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  return { saved, flash };
};
