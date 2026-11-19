-- MAG Intelligence: mag_contacts table
--
-- Stores scanner-ranked contact intelligence from an agent's own iMessage.
-- Each row is owned by the agent whose Mac ran the scan (owner_email).
-- RLS enforces that agents only see their own contacts — not any other
-- agent's address book.
--
-- Composite PK (phone, owner_email): same phone number can be a contact
-- for multiple agents without collision.
--
-- Apply via Supabase dashboard > SQL Editor.

CREATE TABLE IF NOT EXISTS mag_contacts (
  phone                TEXT        NOT NULL,
  owner_email          TEXT        NOT NULL,  -- agent whose iMessage was scanned
  display_name         TEXT,
  is_casa              BOOLEAN     DEFAULT false,
  tier                 TEXT        CHECK (tier IN ('act_today', 'follow_up', 'monitor')),
  last_seen            TIMESTAMPTZ,            -- real iMessage timestamp, never CRM date
  first_seen           TIMESTAMPTZ,
  days_since_last      INTEGER,
  unanswered_inbound   BOOLEAN     DEFAULT false,
  business_signals     INTEGER     DEFAULT 0,
  total_messages       INTEGER     DEFAULT 0,
  from_them            INTEGER     DEFAULT 0,
  from_me              INTEGER     DEFAULT 0,
  last_message_preview TEXT,                  -- truncated to 200 chars; never full content
  synced_at            TIMESTAMPTZ DEFAULT now(),
  created_at           TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (phone, owner_email)
);

-- Enable RLS
ALTER TABLE mag_contacts ENABLE ROW LEVEL SECURITY;

-- Agents see ONLY their own scanner contacts.
-- owner_email is set at sync time by the backend (never from client input).
CREATE POLICY "agents see only their own contacts"
  ON mag_contacts FOR SELECT
  TO authenticated
  USING (owner_email = auth.email());

-- Indexes for Today screen queries
CREATE INDEX IF NOT EXISTS mag_contacts_owner_tier_last_seen
  ON mag_contacts (owner_email, tier, last_seen DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS mag_contacts_owner_last_seen
  ON mag_contacts (owner_email, last_seen DESC NULLS LAST);

COMMENT ON TABLE mag_contacts IS
  'Scanner-ranked iMessage contacts. Primary source for Today/People screens. '
  'Each row is scoped to the agent who ran the scan (owner_email). '
  'Joined with leads on phone for CRM enrichment. Never contains full conversation content.';
