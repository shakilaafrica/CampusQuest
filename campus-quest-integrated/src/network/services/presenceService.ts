import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabaseClient';
import type { GameScreen, PresenceSummary } from '../types';

const CHANNEL = 'orientgame-online';

interface PresencePayload {
  screen: GameScreen;
}

export interface PresenceHandle {
  setScreen: (screen: GameScreen) => void;
  leave: () => Promise<void>;
}

/**
 * Joins the shared "who's online" channel.
 * Privacy: each tab uses a random key and only shares which screen it's on,
 * so other players never see usernames or user ids through presence.
 * One player with two tabs open counts as two connections.
 */
export function joinPresence(
  initialScreen: GameScreen,
  onSummary: (summary: PresenceSummary) => void,
): PresenceHandle {
  const key = crypto.randomUUID();
  let screen: GameScreen = initialScreen;
  let subscribed = false;

  const channel: RealtimeChannel = getSupabase().channel(CHANNEL, {
    config: { presence: { key } },
  });

  channel.on('presence', { event: 'sync' }, () => {
    onSummary(summarise(channel.presenceState<PresencePayload>()));
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      subscribed = true;
      await channel.track({ screen } satisfies PresencePayload);
    }
  });

  return {
    setScreen(next) {
      if (next === screen) return;
      screen = next;
      if (subscribed) void channel.track({ screen } satisfies PresencePayload);
    },
    async leave() {
      subscribed = false;
      await channel.untrack().catch(() => undefined);
      await getSupabase().removeChannel(channel);
    },
  };
}

function summarise(state: Record<string, PresencePayload[]>): PresenceSummary {
  const byScreen: Record<string, number> = {};
  let total = 0;
  for (const entries of Object.values(state)) {
    const latest = entries[entries.length - 1];
    if (!latest) continue;
    total += 1;
    byScreen[latest.screen] = (byScreen[latest.screen] ?? 0) + 1;
  }
  return { total, byScreen };
}
