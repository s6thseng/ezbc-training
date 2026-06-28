"use server";

import { supabase } from "@/lib/supabase";
import type { Player } from "@/types/database";

export async function findOrCreatePlayer(name: string): Promise<Player> {
  const cleanedName = name.trim();

  if (!cleanedName) {
    throw new Error("Name cannot be empty.");
  }

  const { data: existingPlayer, error: selectError } = await supabase
    .from("players")
    .select("id, name, last_seen")
    .ilike("name", cleanedName)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existingPlayer) {
    const { data: updatedPlayer, error: updateError } = await supabase
      .from("players")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", existingPlayer.id)
      .select("id, name, last_seen")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return updatedPlayer;
  }

  const { data: newPlayer, error: insertError } = await supabase
    .from("players")
    .insert({
      name: cleanedName,
      last_seen: new Date().toISOString(),
    })
    .select("id, name, last_seen")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return newPlayer;
}