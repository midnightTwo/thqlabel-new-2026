-- CASCADE DELETE: profiles -> auth.users
-- When you delete from profiles, it automatically deletes from auth.users
-- This frees up email and nickname

-- Step 1: Ensure CASCADE from auth.users to profiles exists
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Step 2: Create function for reverse delete (profiles -> auth.users)
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on profiles delete
DROP TRIGGER IF EXISTS on_profile_delete_cascade_auth ON profiles;

CREATE TRIGGER on_profile_delete_cascade_auth
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- Usage: DELETE FROM profiles WHERE id = 'user-uuid-here';
-- This will automatically delete from auth.users and free up email/nickname