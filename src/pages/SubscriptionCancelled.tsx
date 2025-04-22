import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const SubscriptionCancelled = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/subscription");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black px-4 flex flex-col items-center justify-center">
      <Logo size="md" className="mb-6" />
      <div className="max-w-xl w-full bg-zinc-900/40 border border-zinc-800 rounded-lg p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Subscription Cancelled</h1>
          
          <p className="text-zinc-400 mb-8">
            You've cancelled the subscription process. No worries - you can subscribe anytime when you're ready.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              onClick={() => navigate("/subscription")}
              className="bg-quicktok-orange hover:bg-quicktok-orange/90 flex-1"
            >
              Try Again <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 flex-1"
              asChild
            >
              <Link to="/create">Back to Create</Link>
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

export default SubscriptionCancelled;
