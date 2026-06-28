"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function checkAdmin(key: string) {
  if (key !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
}

export async function createWeek(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const label = String(formData.get("label"));
  const startsOn = String(formData.get("startsOn"));

  await supabaseAdmin.from("weeks").insert({
    label,
    starts_on: startsOn,
    is_current: false,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function setCurrentWeek(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const weekId = String(formData.get("weekId"));

  await supabaseAdmin.from("weeks").update({ is_current: false }).neq("id", "");
  await supabaseAdmin.from("weeks").update({ is_current: true }).eq("id", weekId);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createSession(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  await supabaseAdmin.from("sessions").insert({
    week_id: String(formData.get("weekId")),
    date: String(formData.get("date")),
    time: String(formData.get("time")),
    location: String(formData.get("location")),
    description: String(formData.get("description")),
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSession(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  await supabaseAdmin
    .from("sessions")
    .delete()
    .eq("id", String(formData.get("sessionId")));

  revalidatePath("/");
  revalidatePath("/admin");
}
