import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Subscription as SubscriptionType } from "@/types";

interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  transaction_type: string;
  created_at: string;
}

interface CreditsContextType {
  credits: number | null;
  loading: boolean;
  subscription: SubscriptionType | null;
  transactions: CreditTransaction[];
  refreshCredits: () => Promise<void>;
  hasEnoughCredits: (required: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: null,
  loading: true,
  subscription: null,
  transactions: [],
  refreshCredits: async () => {},
  hasEnoughCredits: () => false,
});

export const useCredits = () => useContext(CreditsContext);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCredits = async () => {
    if (!user || !session) {
      setCredits(null);
      setSubscription(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching credits with auth session:", !!session);
      
      // Make sure we're using the latest session token
      const { data, error } = await supabase.functions.invoke("get-user-credits", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error("Error fetching credits:", error);
        toast.error("Could not load credit information");
        
        // If we've tried less than 3 times and got an error, try again after a delay
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchCredits(), 2000);
        }
        return;
      }

      // Reset retry count on success
      setRetryCount(0);

      if (data.credits) {
        setCredits(data.credits.credits_remaining);
        setSubscription(data.subscription);
        setTransactions(data.transactions || []);
      } else {
        console.warn("Credits endpoint returned no credits data:", data);
        // Set defaults if no data
        setCredits(0);
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
      toast.error("Could not load credit information");
      
      // If we've tried less than 3 times and got an error, try again after a delay
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchCredits(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session) {
      fetchCredits();
    } else {
      setCredits(null);
      setSubscription(null);
      setTransactions([]);
      setLoading(false);
    }
  }, [user, session]);

  const hasEnoughCredits = (required: number): boolean => {
    if (credits === null) return false;
    return credits >= required;
  };

  console.log("subscription object:", subscription);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        loading,
        subscription,
        transactions,
        refreshCredits: fetchCredits,
        hasEnoughCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
};
