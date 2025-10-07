import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
      console.warn('Supabase not configured, demo mode enabled');
      // In demo mode, hydrate user from localStorage if present so routes work across pages
      try {
        const stored = localStorage.getItem('auth_user');
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
        }
      } catch {}
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
      // Demo mode - simulate successful login
      const mockUser = {
        id: 'demo-user-id',
        email: email,
        user_metadata: { name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;
      setUser(mockUser);
      try { localStorage.setItem('auth_user', JSON.stringify(mockUser)); } catch {}
      return { data: { user: mockUser }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
      // Demo mode - simulate successful signup
      return { data: { user: null }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
      // Demo mode - just clear user state
      setUser(null);
      try { localStorage.removeItem('auth_user'); } catch {}
      navigate("/login");
      return;
    }

    await supabase.auth.signOut();
    navigate("/login");
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
