-- Add skip_ssl_verify column to monitors table
ALTER TABLE monitors ADD COLUMN IF NOT EXISTS skip_ssl_verify BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN monitors.skip_ssl_verify IS 'Skip SSL certificate verification for self-signed certificates';
