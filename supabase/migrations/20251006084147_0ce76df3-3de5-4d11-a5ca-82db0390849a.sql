-- Create vlog categories table
CREATE TABLE IF NOT EXISTS public.vlog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create vlogs table
CREATE TABLE IF NOT EXISTS public.vlogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category_id uuid REFERENCES public.vlog_categories(id),
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vlog likes table
CREATE TABLE IF NOT EXISTS public.vlog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vlog_id uuid REFERENCES public.vlogs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vlog_id, user_id)
);

-- Create vlog comments table
CREATE TABLE IF NOT EXISTS public.vlog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vlog_id uuid REFERENCES public.vlogs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.vlog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vlog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vlog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vlog_categories
CREATE POLICY "Anyone can view categories" ON public.vlog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.vlog_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for vlogs
CREATE POLICY "Anyone can view vlogs" ON public.vlogs FOR SELECT USING (true);
CREATE POLICY "Users can insert their own vlogs" ON public.vlogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vlogs" ON public.vlogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vlogs" ON public.vlogs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vlog_likes
CREATE POLICY "Anyone can view likes" ON public.vlog_likes FOR SELECT USING (true);
CREATE POLICY "Users can like vlogs" ON public.vlog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike vlogs" ON public.vlog_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vlog_comments
CREATE POLICY "Anyone can view approved comments" ON public.vlog_comments FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can comment" ON public.vlog_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.vlog_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.vlog_comments FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Create trigger for updating vlogs.updated_at
CREATE TRIGGER update_vlogs_updated_at
  BEFORE UPDATE ON public.vlogs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vlog_comments_updated_at
  BEFORE UPDATE ON public.vlog_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment vlog views
CREATE OR REPLACE FUNCTION public.increment_vlog_views(vlog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vlogs
  SET views = views + 1
  WHERE id = vlog_id;
END;
$$;

-- Insert default categories
INSERT INTO public.vlog_categories (name) VALUES 
  ('Travel'),
  ('Food'),
  ('Tech'),
  ('Lifestyle'),
  ('Education'),
  ('Entertainment')
ON CONFLICT (name) DO NOTHING;

-- Create storage bucket for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vlogs', 'vlogs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vlogs bucket
CREATE POLICY "Anyone can view vlog files" ON storage.objects FOR SELECT USING (bucket_id = 'vlogs');
CREATE POLICY "Authenticated users can upload vlog files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vlogs' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own vlog files" ON storage.objects FOR UPDATE USING (bucket_id = 'vlogs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own vlog files" ON storage.objects FOR DELETE USING (bucket_id = 'vlogs' AND auth.uid()::text = (storage.foldername(name))[1]);