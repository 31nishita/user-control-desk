-- After creating a user in Supabase Dashboard, run this SQL
-- Replace 'admin@company.com' with your actual email if different

-- Get the user ID
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'admin@company.com'
  LIMIT 1;

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please create user in Supabase Dashboard first.';
  ELSE
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Insert profile
    INSERT INTO public.profiles (id, user_id, name, email, role, status)
    VALUES (
      v_user_id,
      v_user_id,
      'Admin User',
      'admin@company.com',
      'admin',
      'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';

    RAISE NOTICE 'Admin user setup complete!';
  END IF;
END $$;
