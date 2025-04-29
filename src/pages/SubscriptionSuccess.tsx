import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCredits } from "@/context/CreditsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, refreshCredits } = useCredits();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Redirect to login if no user
    if (!user) {
      navigate("/auth");
      return;
    }

    const activateSubscription = async () => {
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;
      
      try {
        setStatus("loading");
        setMessage("Activating your subscription...");

        // Upsert subscription record and grant credits
        const sessionId = searchParams.get("session_id");
        if (!sessionId) throw new Error("No session ID found in URL.");
        const { data: subData, error: fnError } = await supabase.functions.invoke(
          "manual-subscription-add",
          { body: { sessionId, userId: user.id } }
        );
        if (fnError || !subData) {
          throw new Error(fnError?.message || "Failed to save subscription.");
        }

        // Refresh credits and subscription context
        await refreshCredits();

        setStatus("success");
        setMessage("Your subscription is now active!");
        setPlanId(subData.subscription?.plan_type || "");
        toast.success("Subscription activated successfully!");
      } catch (err) {
        console.error("Subscription activation error:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Error occurred.");
        toast.error("Subscription activation failed. Please contact support.");
        hasProcessedRef.current = false;
      }
    };

    activateSubscription();
  }, [user, searchParams, navigate, refreshCredits]);

  const handleRetry = () => {
    hasProcessedRef.current = false;
    window.location.reload();
  };

  const handleManualActivation = async (selectedPlan: string) => {
    // Prevent multiple activations
    if (hasProcessedRef.current) {
      toast.info("Subscription is already being processed.");
      return;
    }
    
    hasProcessedRef.current = true;
    
    try {
      setStatus("loading");
      setMessage(`Manually activating ${selectedPlan} plan...`);

      // Create subscription record for selected plan manually
      const { data: stripeData2, error: stripeError2 } = await supabase.functions.invoke("manual-subscription-add", {
        body: { planId: selectedPlan, userId: user.id }
      });
      if (stripeError2 || !stripeData2) {
        throw new Error(stripeError2?.message || "Failed to save subscription");
      }

      // Refresh local credits and subscription context
      await refreshCredits();

      setStatus("success");
      setMessage("Your subscription is now active!");
      setPlanId(stripeData2.subscription?.plan_type || selectedPlan);
      toast.success("Subscription activated successfully!");
    } catch (error) {
      console.error("Error manually activating subscription:", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "An unknown error occurred");
      toast.error("Failed to activate subscription. Please try again or contact support.");
      // Reset the flag so user can retry
      hasProcessedRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
      >
        <div className="flex flex-col items-center justify-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-quicktok-orange animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Processing</h2>
              <p className="text-center text-gray-300 mb-6">{message}</p>
            </>
          )}
          
          {status === "success" && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-6">Subscription Active!</h2>
              <div className="space-y-4">
                <Button
                  className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90"
                  onClick={() => navigate("/create")}
                >
                  Create Videos
                </Button>
                <Button
                  className="w-full bg-zinc-800 hover:bg-zinc-700"
                  onClick={() => navigate("/subscription")}
                >
                  Back to Subscriptions
                </Button>
              </div>
            </div>
          )}
          
          {status === "error" && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h2>
              <p className="text-center text-gray-300 mb-6">{message}</p>
              
              <div className="space-y-4 w-full">
                <Button 
                  onClick={handleRetry}
                  className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90 text-white"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
