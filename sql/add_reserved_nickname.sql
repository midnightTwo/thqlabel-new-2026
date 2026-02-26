-- =============================================================================
-- MIGRATION: Add reserved_nickname column to releases_exclusive
-- Purpose: Allows admins to create releases for artists who haven't registered yet.
--          When the artist registers with the matching nickname, releases are
--          automatically claimed and linked to their account.
-- Run this in Supabase SQL Editor once.
-- =============================================================================

-- 1. Drop NOT NULL constraint on user_id so releases can be created for unregistered artists
ALTER TABLE releases_exclusive
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add the reserved_nickname column
ALTER TABLE releases_exclusive
  ADD COLUMN IF NOT EXISTS reserved_nickname TEXT;

-- 2. Index for fast lookup when claiming releases on user registration
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_reserved_nickname
  ON releases_exclusive (LOWER(reserved_nickname))
  WHERE reserved_nickname IS NOT NULL AND user_id IS NULL;

-- 3. Optional: Supabase database trigger to auto-claim on profile insert
--    (alternative to the API-based approach — pick one or use both for redundancy)
CREATE OR REPLACE FUNCTION claim_reserved_releases_on_register()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.nickname IS NOT NULL THEN
    UPDATE releases_exclusive
    SET user_id = NEW.id, reserved_nickname = NULL
    WHERE user_id IS NULL
      AND LOWER(reserved_nickname) = LOWER(NEW.nickname);
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table (fires after INSERT or nickname UPDATE)
DROP TRIGGER IF EXISTS trg_claim_reserved_releases ON profiles;
CREATE TRIGGER trg_claim_reserved_releases
  AFTER INSERT OR UPDATE OF nickname ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION claim_reserved_releases_on_register();

-- 4. RLS policy: Admins can insert releases with user_id = NULL (pending/reserved releases)
-- (Only needed if existing admin policy doesn't already cover this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'releases_exclusive' AND policyname = 'admins_insert_pending_releases'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "admins_insert_pending_releases" ON releases_exclusive
        FOR INSERT TO authenticated
        WITH CHECK (
          user_id IS NULL AND EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
          )
        );
    $policy$;
  END IF;
END $$;
