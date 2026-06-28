"use client";

import { useEffect, useState } from "react";
import { findOrCreatePlayer } from "@/app/actions/player";
import type { Player } from "@/types/database";
import styles from "./PlayerSelector.module.css";

type PlayerSelectorProps = {
  onPlayerChange?: (player: Player | null) => void;
};

export function PlayerSelector({ onPlayerChange }: PlayerSelectorProps) {
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    const savedName = localStorage.getItem("ezbc-player-name");

    if (savedName) {
      setName(savedName);
      void loadPlayer(savedName);
    }
  }, []);

  async function loadPlayer(inputName: string) {
    const cleanedName = inputName.trim();

    if (!cleanedName) {
      setPlayer(null);
      onPlayerChange?.(null);
      return;
    }

    try {
      setStatus("saving");

      const loadedPlayer = await findOrCreatePlayer(cleanedName);

      setPlayer(loadedPlayer);
      localStorage.setItem("ezbc-player-name", loadedPlayer.name);
      onPlayerChange?.(loadedPlayer);
      setStatus("saved");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setPlayer(null);
      onPlayerChange?.(null);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void loadPlayer(name);
    }
  }

  return (
    <section className={styles.container}>
      <label className={styles.label} htmlFor="player-name">
        Your name
      </label>

      <div className={styles.row}>
        <input
          id="player-name"
          className={styles.input}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setStatus("idle");
          }}
          onBlur={() => void loadPlayer(name)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your name"
        />

        {status === "saving" && <span className={styles.status}>Saving...</span>}
        {status === "saved" && player && (
          <span className={styles.status}>Playing as {player.name}</span>
        )}
        {status === "error" && (
          <span className={styles.error}>Could not save name</span>
        )}
      </div>
    </section>
  );
}