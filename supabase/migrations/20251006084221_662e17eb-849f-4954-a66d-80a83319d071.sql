-- Fix security: Set search_path for increment_vlog_views function
CREATE OR REPLACE FUNCTION public.increment_vlog_views(vlog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vlogs
  SET views = views + 1
  WHERE id = vlog_id;
END;
$$;