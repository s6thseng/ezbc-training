import type { PlayerAvailability, Session } from "@/types/database";
import styles from "./ScheduleTable.module.css";

type ScheduleTableProps = {
  sessions: Session[];
  availability: PlayerAvailability[];
};

function formatDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export function ScheduleTable({
  sessions,
  availability,
}: ScheduleTableProps) {
  if (sessions.length === 0) {
    return <p className={styles.empty}>No sessions planned for this week.</p>;
  }

  const totals = sessions.map((session) =>
    availability.filter((entry) => entry.sessionIds.includes(session.id)).length
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.nameCol}>Name</th>
            {sessions.map((session) => (
              <th key={session.id}>
                <div className={styles.date}>{formatDate(session.date)}</div>
                <div className={styles.time}>{formatTime(session.time)}</div>
                {session.location && (
                  <div className={styles.location}>📍 {session.location}</div>
                )}
                {session.description && (
                  <div className={styles.description}>
                    {session.description}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {availability.map((entry) => (
            <tr key={entry.player.id}>
              <td className={styles.nameCol}>{entry.player.name}</td>
              {sessions.map((session) => (
                <td key={session.id} className={styles.checkCell}>
                  {entry.sessionIds.includes(session.id) ? "✓" : ""}
                </td>
              ))}
            </tr>
          ))}

          <tr>
            <td className={styles.nameCol}>Total</td>
            {totals.map((total, index) => (
              <td key={sessions[index].id} className={styles.totalCell}>
                {total}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}