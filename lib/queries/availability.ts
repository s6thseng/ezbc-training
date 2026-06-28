import { supabase } from "@/lib/supabase";
import type { PlayerAvailability } from "@/types/database";

export async function getAvailabilityForSessions(
  sessionIds: string[]
): Promise<PlayerAvailability[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("availability")
    .select(
      `
      session_id,
      players (
        id,
        name,
        last_seen
      )
    `
    )
    .in("session_id", sessionIds);

  if (error) {
    console.error("Failed to load availability:", error.message);
    return [];
  }

  const grouped = new Map<string, PlayerAvailability>();

  for (const row of data ?? []) {
    const player = Array.isArray(row.players) ? row.players[0] : row.players;

    if (!player) continue;

    if (!grouped.has(player.id)) {
      grouped.set(player.id, {
        player,
        sessionIds: [],
      });
    }

    grouped.get(player.id)!.sessionIds.push(row.session_id);
  }

  return [...grouped.values()].sort((a, b) => {
    const aTime = a.player.last_seen ?? "";
    const bTime = b.player.last_seen ?? "";
    return bTime.localeCompare(aTime);
  });
}