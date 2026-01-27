-- Migration: Add auth_profiles table and auth_profile_id to monitors
-- Run this in Supabase SQL Editor

-- Create auth_profiles table
CREATE TABLE IF NOT EXISTS auth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  login_url TEXT NOT NULL,
  login_method VARCHAR(10) NOT NULL DEFAULT 'POST' CHECK (login_method IN ('GET', 'POST')),
  login_body JSONB NOT NULL DEFAULT '{}',
  token_path VARCHAR(255) NOT NULL DEFAULT 'access_token',
  token_type VARCHAR(20) NOT NULL DEFAULT 'Bearer' CHECK (token_type IN ('Bearer', 'Basic', 'API-Key')),
  header_name VARCHAR(100) NOT NULL DEFAULT 'Authorization',
  expires_in_seconds INTEGER DEFAULT 3600,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add auth_profile_id column to monitors (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monitors' AND column_name = 'auth_profile_id'
  ) THEN
    ALTER TABLE monitors ADD COLUMN auth_profile_id UUID REFERENCES auth_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_profiles_user_id ON auth_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_monitors_auth_profile_id ON monitors(auth_profile_id);

-- Enable RLS
ALTER TABLE auth_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Users can manage their own auth profiles" ON auth_profiles;
CREATE POLICY "Users can manage their own auth profiles"
  ON auth_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_auth_profiles_updated_at ON auth_profiles;
CREATE TRIGGER update_auth_profiles_updated_at
  BEFORE UPDATE ON auth_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
