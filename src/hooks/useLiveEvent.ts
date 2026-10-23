import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { qk } from './queries';

/**
 * Live "slots left" counter. Subscribes to changes on this event's shifts through
 * Supabase Realtime (read only) and refetches the event when anything changes.
 *
 * Needs the SQL from the deployment guide: RLS enabled, a select policy on `shifts`
 * for logged-in users, and `alter publication supabase_realtime add table public.shifts`.
 * Without it the screen still works, it just won't update by itself.
 */
export function useLiveEvent(eventId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `event_id=eq.${eventId}` },
        () => {
          void qc.invalidateQueries({ queryKey: qk.event(eventId) });
          void qc.invalidateQueries({ queryKey: ['events'] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, qc]);
}
