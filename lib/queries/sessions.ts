import { supabase } from "@/lib/supabase";
import type { Session } from "@/types/database";

export async function getSessionsForWeek(weekId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, week_id, date, time, end_time, location, description")
    .eq("week_id", weekId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error("Failed to load sessions:", error.message);
    return [];
  }

  return data ?? [];
}
