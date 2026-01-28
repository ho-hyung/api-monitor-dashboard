-- Add skip_ssl_verify column to auth_profiles table
ALTER TABLE auth_profiles ADD COLUMN IF NOT EXISTS skip_ssl_verify BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN auth_profiles.skip_ssl_verify IS 'Skip SSL certificate verification for login URL with self-signed certificates';
