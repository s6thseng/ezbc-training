"use client";

import type { Player, PlayerAvailability, Session } from "@/types/database";
import styles from "./ScheduleTable.module.css";

type ScheduleTableProps = {
  sessions: Session[];
  availability: PlayerAvailability[];
  currentPlayer: Player | null;
  onToggleSession: (sessionId: string, checked: boolean) => void;
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
  currentPlayer,
  onToggleSession,
}: ScheduleTableProps) {
  if (sessions.length === 0) {
    return <p className={styles.empty}>No sessions planned for this week.</p>;
  }

  const currentEntry =
    currentPlayer
      ? availability.find((entry) => entry.player.id === currentPlayer.id) ?? {
          player: currentPlayer,
          sessionIds: [],
        }
      : null;

  const otherRows = availability.filter(
    (entry) => !currentPlayer || entry.player.id !== currentPlayer.id
  );

  const visibleRows = currentEntry
    ? [currentEntry, ...otherRows]
    : otherRows;

  const totals = sessions.map((session) =>
    visibleRows.filter((entry) => entry.sessionIds.includes(session.id)).length
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.nameCol} aria-label="Players"></th>

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
          {visibleRows.map((entry) => {
            const isCurrentPlayer =
              currentPlayer !== null && entry.player.id === currentPlayer.id;

            return (
              <tr
                key={entry.player.id}
                className={isCurrentPlayer ? styles.currentPlayerRow : ""}
              >
                <td className={styles.nameCol}>{entry.player.name}</td>

                {sessions.map((session) => {
                  const checked = entry.sessionIds.includes(session.id);

                  return (
                    <td key={session.id} className={styles.checkCell}>
                      {isCurrentPlayer ? (
                        <input
                          className={styles.checkbox}
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            onToggleSession(session.id, event.target.checked)
                          }
                        />
                      ) : (
                        <span
                          className={
                            checked ? styles.available : styles.unavailable
                          }
                        >
                          {checked ? "✓" : "–"}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          <tr className={styles.totalRow}>
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