import { Header } from "@/components/Header/Header";
import { ScheduleTable } from "@/components/ScheduleTable/ScheduleTable";
import { getSessionsForWeek } from "@/lib/queries/sessions";
import { getCurrentWeek } from "@/lib/queries/weeks";

export default async function HomePage() {
  const week = await getCurrentWeek();

  if (!week) {
    return (
      <main>
        <section className="card">
          <Header />
          <p className="status error">No current week found ❌</p>
        </section>
      </main>
    );
  }

  const sessions = await getSessionsForWeek(week.id);

  return (
    <main>
      <section className="card wide">
        <Header weekLabel={week.label} />
        <ScheduleTable sessions={sessions} />
      </section>
    </main>
  );
}
