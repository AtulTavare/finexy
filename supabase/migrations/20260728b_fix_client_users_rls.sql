-- Fix infinite recursion in client_users RLS policies.
-- Drops every policy on client_users (removes any self/cross-referential policy
-- that causes 42P17) and recreates a single clean SELECT policy.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'client_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.client_users', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Clients can view own client_users record" ON client_users;
CREATE POLICY "Clients can view own client_users record"
ON client_users FOR SELECT
USING (user_id = auth.uid());

-- Seed / repair the client_users record for chaitanya@infinity.com
INSERT INTO client_users (user_id, client_id, user_name, email)
SELECT au.id, cl.id, cl.name, au.email
FROM auth.users au
JOIN clients cl ON LOWER(cl.mail) = LOWER(au.email)
WHERE au.email = 'chaitanya@infinity.com'
  AND NOT EXISTS (SELECT 1 FROM client_users cu WHERE cu.user_id = au.id);

UPDATE client_users cu
SET client_id = cl.id, user_name = cl.name, email = au.email
FROM auth.users au
JOIN clients cl ON LOWER(cl.mail) = LOWER(au.email)
WHERE au.email = 'chaitanya@infinity.com' AND cu.user_id = au.id;
