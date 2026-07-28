-- Allow clients to view their own client record via client_users link
CREATE POLICY "Clients can view own record"
ON clients FOR SELECT
USING (
  auth.uid() IN (
   SELECT user_id FROM client_users WHERE client_id = clients.id
  )
);

-- Allow clients to view projects linked to them
CREATE POLICY "Clients can view own projects"
ON projects FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM client_users WHERE client_id = projects.client_id
  )
);

-- Allow clients to view their own business payments
CREATE POLICY "Clients can view own payments"
ON business_payments FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM client_users WHERE client_id = business_payments.client_id
  )
);

-- Allow clients to view their own meetings
CREATE POLICY "Clients can view own meetings"
ON meetings FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM client_users WHERE client_id = meetings.client_id
  )
);

-- Allow clients to view their own documents
CREATE POLICY "Clients can view own documents"
ON client_documents FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM client_users WHERE client_id = client_documents.client_id
  )
);

-- Allow clients to view their own client_users record
CREATE POLICY "Clients can view own client_users record"
ON client_users FOR SELECT
USING (user_id = auth.uid());

-- Create get_auth_user_id function to resolve email to user id
CREATE OR REPLACE FUNCTION get_auth_user_id(email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'auth'
AS $$
  SELECT id FROM auth.users WHERE email = $1;
$$;
