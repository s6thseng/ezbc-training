"use client";

import { useEffect, useMemo, useState } from "react";
import { setAvailability } from "@/app/actions/availability";
import { PlayerSelector } from "@/components/PlayerSelector/PlayerSelector";
import { ScheduleTable } from "@/components/ScheduleTable/ScheduleTable";
import { supabase } from "@/lib/supabase";
import type { Player, PlayerAvailability, Session } from "@/types/database";

type Props = {
  sessions: Session[];
  initialAvailability: PlayerAvailability[];
};

async function loadAvailability(
  sessionIds: string[]
): Promise<PlayerAvailability[]> {
  if (sessionIds.length === 0) return [];

  const { data, error } = await supabase
    .from("availability")
    .select(
      `
      session_id,
      players (
        id,
        name,
        last_seen
      )
    `
    )
    .in("session_id", sessionIds);

  if (error) {
    console.error(error.message);
    return [];
  }

  const grouped = new Map<string, PlayerAvailability>();

  for (const row of data ?? []) {
    const player = Array.isArray(row.players) ? row.players[0] : row.players;
    if (!player) continue;

    if (!grouped.has(player.id)) {
      grouped.set(player.id, {
        player,
        sessionIds: [],
      });
    }

    grouped.get(player.id)!.sessionIds.push(row.session_id);
  }

  return [...grouped.values()].sort((a, b) => {
    const aTime = a.player.last_seen ?? "";
    const bTime = b.player.last_seen ?? "";
    return bTime.localeCompare(aTime);
  });
}

export function ScheduleClient({ sessions, initialAvailability }: Props) {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [availability, setAvailabilityState] =
    useState<PlayerAvailability[]>(initialAvailability);

  const sessionIds = useMemo(
    () => sessions.map((session) => session.id),
    [sessions]
  );

  useEffect(() => {
    const channel = supabase
      .channel("availability-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability",
        },
        async () => {
          const freshAvailability = await loadAvailability(sessionIds);
          setAvailabilityState(freshAvailability);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionIds]);

  async function toggleSession(sessionId: string, checked: boolean) {
    if (!currentPlayer) return;

    setAvailabilityState((prev) => {
      const existing = prev.find(
        (entry) => entry.player.id === currentPlayer.id
      );

      if (!existing) {
        return checked
          ? [
              {
                player: currentPlayer,
                sessionIds: [sessionId],
              },
              ...prev,
            ]
          : prev;
      }

      return prev.map((entry) => {
        if (entry.player.id !== currentPlayer.id) return entry;

        const nextSessionIds = checked
          ? Array.from(new Set([...entry.sessionIds, sessionId]))
          : entry.sessionIds.filter((id) => id !== sessionId);

        return {
          ...entry,
          sessionIds: nextSessionIds,
        };
      });
    });

    await setAvailability(currentPlayer.id, sessionId, checked);

    // const freshAvailability = await loadAvailability(sessionIds);
    // setAvailabilityState(freshAvailability);
  }

  return (
    <>
      <PlayerSelector onPlayerChange={setCurrentPlayer} />

      <ScheduleTable
        sessions={sessions}
        availability={availability}
        currentPlayer={currentPlayer}
        onToggleSession={toggleSession}
      />
    </>
  );
}