"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function checkAdmin(key: string) {
  if (key !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
}

function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateFromWeekStart(startsOn: string, dayOffset: number) {
  return addDays(startsOn, dayOffset);
}

function getNextWeekLabel(label: string) {
  const match = label.match(/Week\s+(\d+)/i);
  if (!match) return "Next week";
  return `Week ${Number(match[1]) + 1}`;
}

export async function setCurrentWeek(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const weekId = String(formData.get("weekId"));

  await supabaseAdmin
    .from("weeks")
    .update({ is_current: false })
    .not("id", "is", null);

  await supabaseAdmin
    .from("weeks")
    .update({ is_current: true })
    .eq("id", weekId);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createNextWeek(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const sourceWeekId = String(formData.get("sourceWeekId"));
  const startsOn = String(formData.get("startsOn"));

  const { data: sourceWeek } = await supabaseAdmin
    .from("weeks")
    .select("id, label")
    .eq("id", sourceWeekId)
    .single();

  if (!sourceWeek) throw new Error("Could not load source week.");

  const { data: newWeek } = await supabaseAdmin
    .from("weeks")
    .insert({
      label: getNextWeekLabel(sourceWeek.label),
      starts_on: startsOn,
      is_current: false,
    })
    .select("id")
    .single();

  if (!newWeek) throw new Error("Could not create week.");

  const { data: sourceSessions } = await supabaseAdmin
    .from("sessions")
    .select("date, time, end_time, location, description, is_cancelled")
    .eq("week_id", sourceWeekId);

  if (sourceSessions && sourceSessions.length > 0) {
    await supabaseAdmin.from("sessions").insert(
      sourceSessions.map((session) => ({
        week_id: newWeek.id,
        date: addDays(session.date, 7),
        time: session.time,
        end_time: session.end_time,
        location: session.location,
        description: session.description,
        is_cancelled: session.is_cancelled,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createSession(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const weekStartsOn = String(formData.get("weekStartsOn"));
  const dayOffset = Number(formData.get("dayOffset"));

  await supabaseAdmin.from("sessions").insert({
    week_id: String(formData.get("weekId")),
    date: dateFromWeekStart(weekStartsOn, dayOffset),
    time: String(formData.get("time")),
    end_time: String(formData.get("endTime")),
    location: String(formData.get("location")),
    description: String(formData.get("description")),
    is_cancelled: Boolean(formData.get("isCancelled")),
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSession(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const weekStartsOn = String(formData.get("weekStartsOn"));
  const dayOffset = Number(formData.get("dayOffset"));

  await supabaseAdmin
    .from("sessions")
    .update({
      date: dateFromWeekStart(weekStartsOn, dayOffset),
      time: String(formData.get("time")),
      end_time: String(formData.get("endTime")),
      location: String(formData.get("location")),
      description: String(formData.get("description")),
      is_cancelled: formData.get("isCancelled") === "on",
    })
    .eq("id", String(formData.get("sessionId")));

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function duplicateSession(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const sessionId = String(formData.get("sessionId"));

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("week_id, date, time, end_time, location, description, is_cancelled")
    .eq("id", sessionId)
    .single();

  if (!session) throw new Error("Could not load session.");

  await supabaseAdmin.from("sessions").insert({
    week_id: session.week_id,
    date: session.date,
    time: session.time,
    end_time: session.end_time,
    location: session.location,
    description: session.description,
    is_cancelled: session.is_cancelled,
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

export async function createWeekFromTemplate(formData: FormData) {
  const key = String(formData.get("adminKey"));
  checkAdmin(key);

  const startsOn = String(formData.get("startsOn"));

  const { data: latestWeek } = await supabaseAdmin
    .from("weeks")
    .select("label")
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  const label = latestWeek ? getNextWeekLabel(latestWeek.label) : "Week 1";

  const { data: newWeek, error: weekError } = await supabaseAdmin
    .from("weeks")
    .insert({
      label,
      starts_on: startsOn,
      is_current: false,
    })
    .select("id")
    .single();

  if (weekError || !newWeek) {
    throw new Error("Could not create week.");
  }

  const { data: templates, error: templateError } = await supabaseAdmin
    .from("training_templates")
    .select("day_offset, time, end_time, location, description, is_cancelled")
    .eq("is_active", true)
    .order("day_offset", { ascending: true })
    .order("time", { ascending: true });

  if (templateError) {
    throw new Error("Could not load templates.");
  }

  if (templates && templates.length > 0) {
    await supabaseAdmin.from("sessions").insert(
      templates.map((template) => ({
        week_id: newWeek.id,
        date: addDays(startsOn, template.day_offset),
        time: template.time,
        end_time: template.end_time,
        location: template.location,
        description: template.description,
        is_cancelled: template.is_cancelled,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/admin");
}