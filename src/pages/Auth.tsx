
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Custom icon components since lucide-react doesn't have these icons
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20.94c1.5 0 2.75-.67 3.95-1.89a13.5 13.5 0 0 0 2.87-4.58c.26-.64.49-1.38.49-2.25 0-3.75-2.88-5.25-5.33-5.25-1.24 0-2.25.37-3.03.94-.31.23-.61.5-.88.79-.28-.3-.56-.56-.87-.79-.78-.57-1.79-.94-3.03-.94-2.45 0-5.33 1.5-5.33 5.25 0 .87.23 1.61.49 2.25.63 1.56 1.69 3.17 2.87 4.58 1.2 1.22 2.45 1.89 3.95 1.89.66 0 1.32-.19 1.93-.53.61.34 1.27.53 1.92.53Z"></path>
    <path d="M12 8.98c0-3.33 2.75-4.96 2.75-4.96-.08 2.03 1.89 3.32 1.89 3.32-1.92.08-3.67-.6-4.64 1.64Z"></path>
  </svg>
);

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/create");
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast.success("Check your email for the confirmation link!");
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast.success("Successfully signed in!");
        navigate("/create");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/create'
        }
      });
      
      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Google authentication failed";
      toast.error(errorMessage);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin + '/create'
        }
      });
      
      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Apple authentication failed";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90 text-white"
            disabled={isLoading}
          >
            {isLoading 
              ? "Loading..." 
              : isSignUp 
                ? "Create Account" 
                : "Sign In"
            }
          </Button>
        </form>
        
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-zinc-900 text-gray-400">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            <span className="ml-2">Google</span>
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            onClick={handleAppleSignIn}
          >
            <AppleIcon />
            <span className="ml-2">Apple</span>
          </Button>
        </div>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-quicktok-orange hover:underline text-sm"
          >
            {isSignUp 
              ? "Already have an account? Sign In" 
              : "Don't have an account? Sign Up"
            }
          </button>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
