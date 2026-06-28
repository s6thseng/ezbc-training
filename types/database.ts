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
  location: string | null;
  description: string | null;
};

export type Player = {
  id: string;
  name: string;
  created_at: string;
};

export type Availability = {
  player_id: string;
  session_id: string;
  created_at: string;
};
