/*
  # Add table comments to audit_logs

  This migration adds descriptive comments to the audit_logs table and its columns
  to improve documentation and maintainability.
*/

COMMENT ON TABLE audit_logs IS 'Secure, append-only audit log table with hash chaining for tamper evidence';

COMMENT ON COLUMN audit_logs.hash IS 'SHA-256 hash of the log entry serving as primary key and integrity check';
COMMENT ON COLUMN audit_logs.previous_hash IS 'Hash of the previous log entry, creating a tamper-evident chain';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the audit event occurred';
COMMENT ON COLUMN audit_logs.action IS 'Type of action or event being logged';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.details IS 'JSON containing the audit event details';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level of the audit event (info, warning, error)';
COMMENT ON COLUMN audit_logs.source IS 'System component that generated the audit event';
COMMENT ON COLUMN audit_logs.correlation_id IS 'ID for grouping related audit events together';