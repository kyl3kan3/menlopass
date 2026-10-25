BEGIN;
CREATE TABLE IF NOT EXISTS analytics_installations (
  id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{64}$'),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY,
  installation_id text NOT NULL REFERENCES analytics_installations(id),
  envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_installation ON analytics_events(installation_id);
CREATE TABLE IF NOT EXISTS analytics_jobs (
  id uuid PRIMARY KEY,
  installation_id text NOT NULL REFERENCES analytics_installations(id),
  kind text NOT NULL CHECK (kind IN ('capture', 'erase')),
  envelope jsonb,
  stage text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(installation_id, kind, id)
);
CREATE INDEX IF NOT EXISTS analytics_jobs_due ON analytics_jobs(due_at) WHERE stage <> 'done';
CREATE UNIQUE INDEX IF NOT EXISTS analytics_one_erasure ON analytics_jobs(installation_id) WHERE kind = 'erase';
CREATE TABLE IF NOT EXISTS analytics_limits (
  bucket text NOT NULL, day date NOT NULL DEFAULT CURRENT_DATE, count integer NOT NULL,
  PRIMARY KEY(bucket, day)
);
COMMIT;
