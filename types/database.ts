export type Week = {
  id: string;
  label: string;
  starts_on: string;
  is_current: boolean;
};

export type Session = {
  id: string;
  week_id: string;
  date: string;
  time: string;
  end_time: string | null;
  location: string | null;
  description: string | null;
};

export type Player = {
  id: string;
  name: string;
  last_seen: string | null;
};

export type Availability = {
  player_id: string;
  session_id: string;
  created_at: string;
  updated_at: string | null;
};

export type PlayerAvailability = {
  player: Player;
  sessionIds: string[];
};