-- Prepared for Change Set 2B. Do not execute until approved.
ALTER TABLE public.scrape_logs
  ADD COLUMN IF NOT EXISTS retrieved_at timestamptz NULL;

COMMENT ON COLUMN public.scrape_logs.retrieved_at IS
  'Trusted timestamp set only after a completed external fetch returns validated, nonempty unit inventory.';
