import styles from "./Header.module.css";

type HeaderProps = {
  weekLabel?: string;
};

export function Header({ weekLabel }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>🏸 EZBC Training</h1>
        <p className={styles.subtitle}>
          Training schedule and availability for EZBC badminton.
        </p>
      </div>

      {weekLabel && <div className={styles.weekBadge}>{weekLabel}</div>}
    </header>
  );
}
