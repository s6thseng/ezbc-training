"use server";

import { supabase } from "@/lib/supabase";

export async function setAvailability(
  playerId: string,
  sessionId: string,
  isAvailable: boolean
) {
  await supabase
    .from("players")
    .update({
      last_seen: new Date().toISOString(),
    })
    .eq("id", playerId);

  if (isAvailable) {
    const { error } = await supabase.from("availability").upsert(
      {
        player_id: playerId,
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "player_id,session_id",
      }
    );

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("player_id", playerId)
      .eq("session_id", sessionId);

    if (error) throw new Error(error.message);
  }
}