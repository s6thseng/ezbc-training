import type { Session } from "@/types/database";
import styles from "./ScheduleTable.module.css";

type ScheduleTableProps = {
  sessions: Session[];
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

export function ScheduleTable({ sessions }: ScheduleTableProps) {
  if (sessions.length === 0) {
    return <p className={styles.empty}>No sessions planned for this week.</p>;
  }

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
          <tr>
            <td className={styles.nameCol}>Players</td>
            {sessions.map((session) => (
              <td key={session.id}>0</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
