import type { Week } from "@/types/database";
import styles from "./Header.module.css";

type HeaderProps = {
  week: Week;
};

function formatWeekRange(startsOn: string) {
  const start = new Date(startsOn + "T12:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startLabel = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return `${startLabel} – ${endLabel}`;
}

export function Header({ week }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>🏸 EZBC Training</h1>
        <p className={styles.subtitle}>
          Training schedule and availability for EZBC badminton.
        </p>
      </div>

      <div className={styles.weekBadge}>{formatWeekRange(week.starts_on)}</div>
    </header>
  );
}