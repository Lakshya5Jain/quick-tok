import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refreshCredits } = useCredits();
  const [countdown, setCountdown] = useState(5);

  // Refresh credits data
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/create");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black px-4 flex flex-col items-center justify-center">
      {/* QuickTok logo on top */}
      <Logo size="md" className="mb-6" />
      <div className="max-w-xl w-full bg-zinc-900/40 border border-zinc-800 rounded-lg p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Subscription Successful!</h1>
          
          <p className="text-zinc-400 mb-6">
            Thank you for subscribing to Quick-Tok! Your subscription is now active and credits have been added to your account.
          </p>
          
          <div className="w-full bg-zinc-800 p-4 rounded-md text-left mb-6">
            <p className="text-sm text-zinc-400">
              Session ID: <span className="font-mono text-xs text-zinc-500 break-all">{sessionId}</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              onClick={() => navigate("/create")}
              className="bg-quicktok-orange hover:bg-quicktok-orange/90 flex-1"
            >
              Create Video <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 flex-1"
              asChild
            >
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-zinc-500">
            Redirecting in {countdown} seconds...
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
