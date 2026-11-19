-- MAG Intelligence: mag_contacts table
--
-- Stores scanner-ranked contact intelligence for ALL approved iMessage contacts,
-- independent of CRM leads. The frontend queries this as the primary source of
-- conversation activity and joins with leads on phone for CRM enrichment.
--
-- Why: The scanner ranks 262 contacts but only ~3 had existing CRM rows by phone.
-- Storing scanner data here avoids bulk-creating duplicate CRM leads while
-- exposing all approved contacts in the app.
--
-- Run once after getting approval:
--   psql $SUPABASE_DB_URL -f supabase/migrations/20261119_mag_contacts.sql
-- OR apply via Supabase dashboard > SQL Editor.
--
-- STATUS: PENDING APPROVAL — do not apply without explicit user confirmation.

CREATE TABLE IF NOT EXISTS mag_contacts (
  phone          TEXT PRIMARY KEY,         -- E.164 phone number (e.g. +14155551234)
  display_name   TEXT,                     -- Name from iMessage / address book
  is_casa        BOOLEAN DEFAULT false,    -- Marked as a Casa-network contact

  -- Scanner-derived intelligence (updated on each sync)
  tier           TEXT,                     -- 'act_today' | 'follow_up' | 'monitor'
  last_seen      TIMESTAMPTZ,              -- Last iMessage conversation timestamp
  first_seen     TIMESTAMPTZ,              -- First iMessage conversation timestamp
  days_since_last INTEGER,
  unanswered_inbound BOOLEAN DEFAULT false,
  business_signals INTEGER DEFAULT 0,     -- Composite signal score from scanner
  total_messages  INTEGER DEFAULT 0,
  from_them       INTEGER DEFAULT 0,
  from_me         INTEGER DEFAULT 0,
  last_message_preview TEXT,              -- Truncated preview (never stored in full)

  -- Sync metadata
  synced_at      TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- RLS: authenticated users can read; only service role can write
ALTER TABLE mag_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents can read mag_contacts"
  ON mag_contacts FOR SELECT
  TO authenticated
  USING (true);

-- Index for fast tier-based queries (Today screen)
CREATE INDEX IF NOT EXISTS mag_contacts_tier_last_seen
  ON mag_contacts (tier, last_seen DESC NULLS LAST);

-- Index for phone lookups from leads join
CREATE INDEX IF NOT EXISTS mag_contacts_phone
  ON mag_contacts (phone);

COMMENT ON TABLE mag_contacts IS
  'Scanner-ranked iMessage contacts. Primary source for Today/People screens. '
  'Joined with leads on phone for CRM enrichment. Never contains conversation content.';
