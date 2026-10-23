import { useCallback, useEffect, useState } from 'react';

import { getCurrentCoords, type Coords } from '../lib/location';

/** Current GPS position for the feed. Never throws: if permission is denied the feed just isn't sorted by distance. */
export function useCoords() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      setCoords(await getCurrentCoords());
      setStatus('ok');
    } catch {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { coords, status, refresh };
}
