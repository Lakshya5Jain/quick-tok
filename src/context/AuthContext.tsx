
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Enhanced error handling for auth state changes
    const handleAuthStateChange = (event: string, currentSession: Session | null) => {
      console.log("Auth state changed:", event, currentSession?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        // Only update state if it was an intentional signout
        // This prevents unexpected logouts during API calls
        if (authError) {
          console.log("Auth error detected:", authError);
          toast.error(`Authentication error: ${authError}`);
          setAuthError(null);
        }
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        setAuthError(error.message);
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    // Refresh session periodically to prevent token expiration
    const intervalId = setInterval(() => {
      if (session) {
        supabase.auth.refreshSession().catch(error => {
          console.error("Error refreshing session:", error);
        });
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [authError]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setAuthError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
