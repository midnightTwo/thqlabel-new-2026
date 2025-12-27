-- CLEAN UP ORPHANED USERS
-- Automatically deletes users from auth.users who don't exist in profiles
-- This frees up emails from incomplete registrations

-- Delete all users from auth.users that are NOT in profiles
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);

-- Show how many users were cleaned up
SELECT 'Cleanup complete' as status;
