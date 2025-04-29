import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCredits } from "@/context/CreditsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const CreditPurchaseSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCredits } = useCredits();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // If not logged in, redirect to auth page
    if (!user) {
      navigate("/auth");
      return;
    }

    const processCreditPurchase = async () => {
      // Prevent multiple processing
      if (hasProcessedRef.current) {
        return;
      }
      
      hasProcessedRef.current = true;
      
      try {
        setStatus("loading");
        setMessage("Processing your credit purchase...");

        // Get session ID from URL
        const sessionId = searchParams.get("session_id");
        if (!sessionId) {
          throw new Error("No session ID found in URL. Please contact support.");
        }

        // We'll just refresh credits - the webhook will have processed the credit addition
        await refreshCredits();
        
        // Small delay to ensure credits have been updated
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh again to be sure
        await refreshCredits();

        setStatus("success");
        setMessage("Your credits have been added to your account!");
        
        // Show success toast
        toast.success("Credit purchase successful!");
      } catch (error) {
        console.error("Error processing credit purchase:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "An unknown error occurred");
        toast.error("Failed to process credit purchase. Please contact support if your credits don't appear soon.");
        // Reset the flag so user can retry
        hasProcessedRef.current = false;
      }
    };

    processCreditPurchase();
  }, [user, searchParams, navigate, refreshCredits]);

  const handleGoToSubscriptions = () => {
    navigate("/subscription");
  };

  const handleGoToCreateVideo = () => {
    navigate("/create");
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center px-4">
      <div className="bg-black/40 border border-zinc-800 p-8 rounded-lg max-w-md w-full">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-quicktok-orange animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Processing Your Purchase</h2>
            <p className="text-zinc-400 mb-6">{message}</p>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-zinc-800/50 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-quicktok-orange" />
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h2>
            <p className="text-zinc-400 mb-6">{message}</p>
            <div className="space-y-4">
              <Button
                className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90"
                onClick={handleGoToCreateVideo}
              >
                Create Videos
              </Button>
              <Button
                className="w-full bg-zinc-800 hover:bg-zinc-700"
                onClick={handleGoToSubscriptions}
              >
                Back to Subscriptions
              </Button>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Oops! Something went wrong</h2>
            <p className="text-zinc-400 mb-6">{message}</p>
            <Button
              className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90"
              onClick={handleGoToSubscriptions}
            >
              Back to Subscriptions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditPurchaseSuccess; 