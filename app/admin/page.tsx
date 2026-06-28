import { createSession, createWeek, deleteSession, setCurrentWeek } from "./actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AdminPageProps = {
  searchParams: Promise<{ key?: string }>;
};

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
    .select("id, label, starts_on, is_current, sessions(id, date, time, location, description)")
    .order("starts_on", { ascending: false });

  return (
    <main>
      <section className="card wide">
        <h1>Admin</h1>

        <h2>Create week</h2>
        <form action={createWeek}>
          <input type="hidden" name="adminKey" value={key} />
          <input name="label" placeholder="Week 29" required />
          <input name="startsOn" type="date" required />
          <button>Create week</button>
        </form>

        <hr />

        {weeks?.map((week) => (
          <section key={week.id} style={{ marginTop: 32 }}>
            <h2>
              {week.label} {week.is_current ? "⭐" : ""}
            </h2>
            <p>{week.starts_on}</p>

            <form action={setCurrentWeek}>
              <input type="hidden" name="adminKey" value={key} />
              <input type="hidden" name="weekId" value={week.id} />
              <button>Set as current week</button>
            </form>

            <h3>Sessions</h3>

            {week.sessions?.map((session) => (
              <form key={session.id} action={deleteSession}>
                <input type="hidden" name="adminKey" value={key} />
                <input type="hidden" name="sessionId" value={session.id} />
                <span>
                  {session.date} {session.time} — {session.location} —{" "}
                  {session.description}
                </span>{" "}
                <button>Delete</button>
              </form>
            ))}

            <form action={createSession} style={{ marginTop: 12 }}>
              <input type="hidden" name="adminKey" value={key} />
              <input type="hidden" name="weekId" value={week.id} />
              <input name="date" type="date" required />
              <input name="time" type="time" required />
              <input name="location" placeholder="Pfingstweid" />
              <input name="description" placeholder="Open Play" />
              <button>Add session</button>
            </form>
          </section>
        ))}
      </section>
    </main>
  );
}
