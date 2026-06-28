import { Header } from "@/components/Header/Header";
import { ScheduleClient } from "@/components/Schedule/ScheduleClient";
import { getAvailabilityForSessions } from "@/lib/queries/availability";
import { getSessionsForWeek } from "@/lib/queries/sessions";
import { getCurrentWeek } from "@/lib/queries/weeks";

export default async function HomePage() {
  const week = await getCurrentWeek();

  if (!week) {
    return (
      <main>
        <section className="card">
          <p className="status error">No current week found ❌</p>
        </section>
      </main>
    );
  }

  const sessions = await getSessionsForWeek(week.id);
  const availability = await getAvailabilityForSessions(
    sessions.map((session) => session.id)
  );

  return (
    <main>
      <section className="card wide">
        <Header week={week} />
        <ScheduleClient
          sessions={sessions}
          initialAvailability={availability}
        />
      </section>
    </main>
  );
}