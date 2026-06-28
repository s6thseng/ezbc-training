"use client";

import type { Player, PlayerAvailability, Session } from "@/types/database";
import styles from "./ScheduleTable.module.css";

type ScheduleTableProps = {
  sessions: Session[];
  availability: PlayerAvailability[];
  currentPlayer: Player | null;
  onToggleSession: (sessionId: string, checked: boolean) => void;
};

function formatDay(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(startTime: string, endTime: string | null) {
  const start = startTime.slice(0, 5);
  const end = endTime ? endTime.slice(0, 5) : "";
  return end ? `${start}–${end}` : start;
}

function groupSessionsByDate(sessions: Session[]) {
  const groups: { date: string; sessions: Session[] }[] = [];

  for (const session of sessions) {
    const last = groups[groups.length - 1];

    if (last && last.date === session.date) {
      last.sessions.push(session);
    } else {
      groups.push({ date: session.date, sessions: [session] });
    }
  }

  return groups;
}

function isLastSessionOfDay(sessions: Session[], index: number) {
  return (
    index === sessions.length - 1 ||
    sessions[index + 1].date !== sessions[index].date
  );
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

  const currentEntry = currentPlayer
    ? availability.find((entry) => entry.player.id === currentPlayer.id) ?? {
        player: currentPlayer,
        sessionIds: [],
      }
    : null;

  const otherRows = availability.filter(
    (entry) => !currentPlayer || entry.player.id !== currentPlayer.id
  );

  const visibleRows = currentEntry ? [currentEntry, ...otherRows] : otherRows;

  const totals = sessions.map((session) =>
    visibleRows.filter((entry) => entry.sessionIds.includes(session.id)).length
  );

  const dayGroups = groupSessionsByDate(sessions);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.nameCol} rowSpan={2} aria-label="Players" />

            {dayGroups.map((group) => {
              const isCancelledDay = group.sessions.every(
                (session) => session.is_cancelled
              );

              return (
                <th
                  key={group.date}
                  colSpan={group.sessions.length}
                  className={`${styles.dayHeader} ${
                    isCancelledDay ? styles.cancelledSession : ""
                  }`}
                >
                  {formatDay(group.date)}
                </th>
              );
            })}
          </tr>

          <tr>
            {sessions.map((session, index) => {
              const isLastOfDay = isLastSessionOfDay(sessions, index);
              const isCancelled = session.is_cancelled;

              return (
                <th
                  key={session.id}
                  className={`${styles.sessionHeader} ${
                    isCancelled ? styles.cancelledSession : ""
                  } ${isLastOfDay ? styles.daySeparator : ""}`}
                >
                  <div className={styles.time}>
                    {formatTime(session.time, session.end_time)}
                  </div>

                  {session.location && (
                    <div className={styles.location}>📍 {session.location}</div>
                  )}

                  {session.description && (
                    <div className={styles.description}>
                      {session.description}
                    </div>
                  )}
                </th>
              );
            })}
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

                {sessions.map((session, index) => {
                  const checked = entry.sessionIds.includes(session.id);
                  const isLastOfDay = isLastSessionOfDay(sessions, index);
                  const isCancelled = session.is_cancelled;

                  return (
                    <td
                      key={session.id}
                      className={`${styles.checkCell} ${
                        isCancelled ? styles.cancelledSession : ""
                      } ${isLastOfDay ? styles.daySeparator : ""}`}
                    >
                      {isCurrentPlayer && !isCancelled ? (
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
                            isCancelled
                              ? styles.cancelledBadge
                              : checked
                                ? styles.available
                                : styles.unavailable
                          }
                        >
                          {isCancelled ? "×" : checked ? "✓" : "–"}
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

            {totals.map((total, index) => {
              const isLastOfDay = isLastSessionOfDay(sessions, index);
              const isCancelled = sessions[index].is_cancelled;

              return (
                <td
                  key={sessions[index].id}
                  className={`${styles.totalCell} ${
                    isCancelled ? styles.cancelledSession : ""
                  } ${isLastOfDay ? styles.daySeparator : ""}`}
                >
                  {isCancelled ? "–" : total}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}