import {
  createSession,
  createWeekFromTemplate,
  deleteSession,
  duplicateSession,
  setCurrentWeek,
  updateSession,
} from "./actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import styles from "./Admin.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(startsOn: string) {
  const start = new Date(startsOn + "T12:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} – ${end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

function cleanTime(time: string | null) {
  if (!time) return "";
  return String(time).slice(0, 5);
}

function timeRange(start: string | null, end: string | null) {
  const s = cleanTime(start);
  const e = cleanTime(end);
  return e ? `${s}–${e}` : s;
}

function dayOffsetFromWeekStart(weekStart: string, date: string) {
  const start = new Date(weekStart + "T12:00:00");
  const current = new Date(date + "T12:00:00");

  return Math.round(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("ezbc-admin")?.value;

  if (adminCookie !== process.env.ADMIN_SECRET) {
    redirect("/admin/login");
  }

  const key = process.env.ADMIN_SECRET!;

  const { data: weeks } = await supabaseAdmin
    .from("weeks")
    .select(
      `
      id,
      label,
      starts_on,
      is_current,
      sessions (
        id,
        date,
        time,
        end_time,
        location,
        description,
        is_cancelled
      )
    `
    )
    .order("starts_on", { ascending: false });

  const currentWeek = weeks?.find((week) => week.is_current);

  const nextStartDate = currentWeek
    ? addDays(currentWeek.starts_on, 7)
    : new Date().toISOString().slice(0, 10);

  const sessions = [...(currentWeek?.sessions ?? [])].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return String(a.time).localeCompare(String(b.time));
  });

  return (
    <main>
      <section className="card wide">
        <h1>Admin</h1>

        <div className={styles.panel}>
          <h2>Displayed week</h2>

          <form action={setCurrentWeek} className={styles.inlineForm}>
            <input type="hidden" name="adminKey" value={key} />

            <select name="weekId" defaultValue={currentWeek?.id} required>
              {weeks?.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.label} ({formatWeekRange(week.starts_on)})
                </option>
              ))}
            </select>

            <button type="submit">Show this week</button>
          </form>
        </div>

        <div className={styles.panel}>
          <h2>Create week from template</h2>

          <form action={createWeekFromTemplate} className={styles.inlineForm}>
            <input type="hidden" name="adminKey" value={key} />

            <input
              name="startsOn"
              type="date"
              defaultValue={nextStartDate}
              required
            />

            <button type="submit">Create week</button>
          </form>
        </div>

        {currentWeek && (
          <section className={styles.week}>
            <h2>
              ⭐ {currentWeek.label}{" "}
              <span className={styles.weekRange}>
                {formatWeekRange(currentWeek.starts_on)}
              </span>
            </h2>

            <div className={styles.weekBoard}>
              {DAYS.map((day, dayOffset) => {
                const daySessions = sessions.filter(
                  (session) =>
                    dayOffsetFromWeekStart(
                      currentWeek.starts_on,
                      session.date
                    ) === dayOffset
                );

                return (
                  <div key={day} className={styles.dayColumn}>
                    <h3>{day}</h3>

                    {daySessions.length === 0 ? (
                      <p className={styles.hint}>No sessions</p>
                    ) : (
                      daySessions.map((session) => (
                        <form
                          key={session.id}
                          action={updateSession}
                          className={styles.slotCard}
                        >
                          <input type="hidden" name="adminKey" value={key} />
                          <input
                            type="hidden"
                            name="sessionId"
                            value={session.id}
                          />
                          <input
                            type="hidden"
                            name="weekStartsOn"
                            value={currentWeek.starts_on}
                          />
                          <input
                            type="hidden"
                            name="dayOffset"
                            value={dayOffset}
                          />

                          <strong>
                            {timeRange(session.time, session.end_time)}
                          </strong>

                          <input
                            name="time"
                            defaultValue={cleanTime(session.time)}
                            pattern="[0-2][0-9]:[0-5][0-9]"
                            required
                          />

                          <input
                            name="endTime"
                            defaultValue={cleanTime(session.end_time)}
                            pattern="[0-2][0-9]:[0-5][0-9]"
                            required
                          />

                          <input
                            name="location"
                            defaultValue={session.location ?? ""}
                            placeholder="Location"
                          />

                          <input
                            name="description"
                            defaultValue={session.description ?? ""}
                            placeholder="Description"
                          />

                          <label className={styles.cancelLabel}>
                          <input
                            type="checkbox"
                            name="isCancelled"
                            defaultChecked={session.is_cancelled}
                          />
                          Hidden / cancelled
                        </label>
                          <div className={styles.slotActions}>
                            <button type="submit">Save</button>
                            <button type="submit" formAction={duplicateSession}>
                              Copy
                            </button>
                            <button type="submit" formAction={deleteSession}>
                              Delete
                            </button>
                          </div>
                        </form>
                      ))
                    )}

                    <form action={createSession} className={styles.addSlot}>
                      <input type="hidden" name="adminKey" value={key} />
                      <input type="hidden" name="weekId" value={currentWeek.id} />
                      <input
                        type="hidden"
                        name="weekStartsOn"
                        value={currentWeek.starts_on}
                      />
                      <input type="hidden" name="dayOffset" value={dayOffset} />

                      <input
                        name="time"
                        defaultValue="19:00"
                        pattern="[0-2][0-9]:[0-5][0-9]"
                        required
                      />

                      <input
                        name="endTime"
                        defaultValue="20:00"
                        pattern="[0-2][0-9]:[0-5][0-9]"
                        required
                      />

                      <input name="location" placeholder="Location" />
                      <input name="description" placeholder="Description" />

                      <button type="submit">Add</button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}