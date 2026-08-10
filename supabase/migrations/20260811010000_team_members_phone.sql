-- Phone + Telegram for team members (Admin → Team).
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS telegram TEXT NOT NULL DEFAULT '';
