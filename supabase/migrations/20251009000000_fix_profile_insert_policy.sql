/*
  # Fix Profile Insert Policy for Admin Users

  1. Changes
    - Drop and recreate the INSERT policy for profiles table
    - Ensure admins and managers can create profile records for new users
    - The policy now properly handles the case where an admin creates a profile for a newly signed-up user

  2. Security
    - Maintains RLS restrictions
    - Only authenticated users with admin or manager role can insert profiles
    - Allows admins to create profiles for any user (not just themselves)
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Managers can insert profiles" ON public.profiles;

-- Create a more permissive insert policy that allows admins to create profiles
CREATE POLICY "Admins and managers can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin')
  );
