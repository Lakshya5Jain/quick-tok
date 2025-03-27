
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, is_admin')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setProfile(data);
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    let subscription: { data: { subscription: { unsubscribe: () => void } } };

    // Function to get current session
    const setupAuth = async () => {
      setIsLoading(true);
      
      // First, get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch user profile with timeout to prevent potential deadlocks
        setTimeout(() => {
          fetchUserProfile(currentSession.user.id);
        }, 0);
      }
      
      // Then, set up auth state listener
      subscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsAdmin(false);
        } else if (newSession?.user) {
          // Fetch user profile with timeout to prevent potential deadlocks
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        }
      });
      
      setIsLoading(false);
    };
    
    setupAuth();
    
    // Cleanup
    return () => {
      if (subscription) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success("Successfully signed out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
