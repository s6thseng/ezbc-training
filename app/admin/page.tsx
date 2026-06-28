import {
  createNextWeek,
  createSession,
  deleteSession,
  duplicateSession,
  setCurrentWeek,
  updateSession,
} from "./actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import styles from "./Admin.module.css";

type AdminPageProps = {
  searchParams: Promise<{ key?: string }>;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayOffsetFromWeekStart(weekStart: string, date: string) {
  const start = new Date(weekStart + "T12:00:00");
  const current = new Date(date + "T12:00:00");
  return Math.round(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { key } = await searchParams;

  if (key !== process.env.ADMIN_SECRET) {
    return (
      <main>
        <section className="card">
          <h1>Admin</h1>
          <p className="status error">Unauthorized</p>
        </section>
      </main>
    );
  }

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
        description
      )
    `
    )
    .order("starts_on", { ascending: false });

  const currentWeek = weeks?.find((week) => week.is_current);
  const nextStartDate = currentWeek
    ? addDays(currentWeek.starts_on, 7)
    : new Date().toISOString().slice(0, 10);

  return (
    <main>
      <section className="card wide">
        <h1>Admin</h1>

        <div className={styles.panel}>
          <h2>Current week</h2>
          <form action={setCurrentWeek} className={styles.inlineForm}>
            <input type="hidden" name="adminKey" value={key} />

            <select name="weekId" defaultValue={currentWeek?.id} required>
              {weeks?.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.label} ({formatWeekRange(week.starts_on)})
                </option>
              ))}
            </select>

            <button type="submit">Set current</button>
          </form>
        </div>

        {currentWeek && (
          <div className={styles.panel}>
            <h2>Create next week</h2>

            <form action={createNextWeek} className={styles.inlineForm}>
              <input type="hidden" name="adminKey" value={key} />
              <input type="hidden" name="sourceWeekId" value={currentWeek.id} />

              <input
                name="startsOn"
                type="date"
                defaultValue={nextStartDate}
                required
              />

              <button type="submit">Create from current week</button>
            </form>

            <p className={styles.hint}>
              Copies all sessions from {currentWeek.label} and shifts dates by 7
              days.
            </p>
          </div>
        )}

        {weeks?.map((week) => {
          const sessions = [...(week.sessions ?? [])].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return String(a.time).localeCompare(String(b.time));
          });

          return (
            <section key={week.id} className={styles.week}>
              <h2>
                {week.is_current ? "⭐ " : ""}
                {week.label}{" "}
                <span className={styles.weekRange}>
                  {formatWeekRange(week.starts_on)}
                </span>
              </h2>

              {sessions.length === 0 ? (
                <p className={styles.hint}>No sessions yet.</p>
              ) : (
                <div className={styles.sessionCards}>
                  {sessions.map((session) => {
                    const offset = dayOffsetFromWeekStart(
                      week.starts_on,
                      session.date
                    );

                    return (
                      <form
                        key={session.id}
                        action={updateSession}
                        className={styles.sessionCard}
                      >
                        <input type="hidden" name="adminKey" value={key} />
                        <input type="hidden" name="sessionId" value={session.id} />
                        <input
                          type="hidden"
                          name="weekStartsOn"
                          value={week.starts_on}
                        />

                        <div className={styles.sessionSummary}>
                          <strong>
                            {DAYS[offset] ?? "Day"}{" "}
                            {timeRange(session.time, session.end_time)}
                          </strong>
                          <span>
                            {session.location || "No location"} ·{" "}
                            {session.description || "No description"}
                          </span>
                        </div>

                        <select name="dayOffset" defaultValue={offset}>
                          {DAYS.map((day, index) => (
                            <option key={day} value={index}>
                              {day}
                            </option>
                          ))}
                        </select>

                        <input
                          name="time"
                          placeholder="19:00"
                          pattern="[0-2][0-9]:[0-5][0-9]"
                          defaultValue={cleanTime(session.time)}
                          required
                        />

                        <input
                          name="endTime"
                          placeholder="20:00"
                          pattern="[0-2][0-9]:[0-5][0-9]"
                          defaultValue={cleanTime(session.end_time)}
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

                        <button type="submit">Save</button>
                        <button type="submit" formAction={duplicateSession}>
                          Duplicate
                        </button>
                        <button type="submit" formAction={deleteSession}>
                          Delete
                        </button>
                      </form>
                    );
                  })}
                </div>
              )}

              <h3>Add session</h3>

              <form action={createSession} className={styles.addRow}>
                <input type="hidden" name="adminKey" value={key} />
                <input type="hidden" name="weekId" value={week.id} />
                <input type="hidden" name="weekStartsOn" value={week.starts_on} />

                <select name="dayOffset" defaultValue="1">
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>

                <input
                  name="time"
                  placeholder="19:00"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  defaultValue="19:00"
                  required
                />

                <input
                  name="endTime"
                  placeholder="20:00"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  defaultValue="20:00"
                  required
                />

                <input name="location" placeholder="Pfingstweid" />
                <input name="description" placeholder="Open Play" />

                <button type="submit">Add</button>
              </form>
            </section>
          );
        })}
      </section>
    </main>
  );
}