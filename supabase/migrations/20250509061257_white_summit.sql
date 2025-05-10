/*
  # Create audit logs table with hash chaining

  1. New Tables
    - `audit_logs`
      - `hash` (text, primary key) - SHA-256 hash of the log entry
      - `previous_hash` (text) - Hash of the previous log entry for chain linking
      - `timestamp` (timestamptz) - When the log was created
      - `action` (text) - The action being logged
      - `user_id` (uuid) - The user who performed the action
      - `details` (jsonb) - Encrypted log details
      - `severity` (text) - Log severity level
      - `source` (text) - System component that generated the log
      - `correlation_id` (text) - For tracking related log entries

  2. Security
    - Enable RLS on `audit_logs` table
    - Add policy for authenticated users to read logs
    - Only allow INSERT operations (append-only)
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  hash TEXT PRIMARY KEY,
  previous_hash TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  user_id UUID,
  details JSONB NOT NULL,
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  correlation_id TEXT,
  
  -- Ensure chronological order and hash chain integrity
  CONSTRAINT audit_logs_timestamp_check CHECK (
    CASE 
      WHEN previous_hash IS NULL THEN true  -- First entry
      ELSE timestamp > (
        SELECT timestamp 
        FROM audit_logs 
        WHERE hash = previous_hash
      )
    END
  )
);

-- Enable row level security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for reading logs
CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for inserting logs (append-only)
CREATE POLICY "Allow insert only"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster chain traversal
CREATE INDEX IF NOT EXISTS audit_logs_previous_hash_idx ON audit_logs(previous_hash);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);