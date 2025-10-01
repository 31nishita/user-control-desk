-- Assign admin role to the first user (or current user if signed in)
-- This helps bootstrap the admin access

-- First, let's add a policy to allow users to be assigned roles during setup
CREATE POLICY "Allow initial admin assignment" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role)
);

-- Insert admin role for the oldest user in the system
-- This assumes the first user should be the admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure they have a profile
INSERT INTO public.profiles (id, user_id, name, email, role, status)
SELECT 
  u.id,
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  u.email,
  'admin',
  'active'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = u.id)
ORDER BY u.created_at ASC
LIMIT 1;

-- After first admin is created, drop the temporary policy
-- (It will only allow ONE admin to be created due to the EXISTS check)
DROP POLICY IF EXISTS "Allow initial admin assignment" ON public.user_roles;