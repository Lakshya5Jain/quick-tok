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
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setSubscription(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("get-user-credits");

      if (error) {
        console.error("Error fetching credits:", error);
        toast.error("Could not load credit information");
        return;
      }

      if (data.credits) {
        setCredits(data.credits.credits_remaining);
        setSubscription(data.subscription);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
      toast.error("Could not load credit information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
    } else {
      setCredits(null);
      setSubscription(null);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const hasEnoughCredits = (required: number): boolean => {
    if (credits === null) return false;
    return credits >= required;
  };

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
