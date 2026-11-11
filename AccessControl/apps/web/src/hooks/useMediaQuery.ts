import { useEffect, useState } from 'react';

const matches = (query: string) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

/** Acompanha uma media query (falso onde não há matchMedia, como no jsdom). */
export function useMediaQuery(query: string) {
  const [value, setValue] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const update = () => setValue(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return value;
}
