import { supabase } from "@/lib/supabase";
import type { Week } from "@/types/database";

export async function getCurrentWeek(): Promise<Week | null> {
  const { data, error } = await supabase
    .from("weeks")
    .select("id, label, starts_on, is_current")
    .eq("is_current", true)
    .single();

  if (error) {
    console.error("Failed to load current week:", error.message);
    return null;
  }

  return data;
}
