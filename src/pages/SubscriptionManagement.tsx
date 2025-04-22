import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCredits } from "@/context/CreditsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, credits, refreshCredits } = useCredits();
  const [isLoading, setIsLoading] = React.useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const cancelSubscription = async () => {
    if (!user || !subscription || !subscription.stripe_subscription_id) {
      toast.error("No valid subscription found to cancel");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: {
          subscriptionId: subscription.stripe_subscription_id
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      await refreshCredits();
      toast.success("Your subscription has been cancelled");
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      toast.error("Could not cancel subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate days remaining in subscription
  const daysRemaining = () => {
    if (!subscription?.current_period_end) return 0;
    
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Calculate percentage of subscription period completed
  const subscriptionProgress = () => {
    if (!subscription?.current_period_start || !subscription?.current_period_end) return 0;
    
    const startDate = new Date(subscription.current_period_start);
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    
    const totalPeriod = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    const percentage = Math.min(100, Math.max(0, (elapsed / totalPeriod) * 100));
    return Math.round(percentage);
  };

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-7xl mx-auto pt-8">
        <Navbar
          activeTab="subscription"
          onTabChange={(tab) => {
            if (tab === "generate" || tab === "videos") navigate("/create");
            else if (tab === "dashboard") navigate("/dashboard");
            else if (tab === "subscription") navigate(subscription?.active ? "/subscription-management" : "/subscription");
          }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key="subscription-management"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/subscription")}
              >
                View Plans
              </Button>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription?.active ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-sm text-zinc-400">Plan</p>
                        <p className="text-xl font-semibold text-white capitalize">
                          {subscription.plan_type || "Basic"}
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-sm text-zinc-400">Monthly Credits</p>
                        <p className="text-xl font-semibold text-white">
                          {subscription.monthly_credits} credits
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-sm text-zinc-400">Next Billing Date</p>
                        <p className="text-xl font-semibold text-white">
                          {formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-800/30 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-zinc-400">Billing Period Progress</p>
                        <p className="text-sm text-zinc-400">{daysRemaining()} days remaining</p>
                      </div>
                      <Progress value={subscriptionProgress()} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center pt-4">
                      <p className="text-sm text-zinc-400">Current Credits: <span className="font-semibold">{credits}</span></p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={cancelSubscription}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Cancel Subscription
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <CreditCard className="h-12 w-12 mx-auto text-zinc-500" />
                    <div className="space-y-2">
                      <p className="text-lg text-zinc-300">No Active Subscription</p>
                      <p className="text-zinc-400 max-w-md mx-auto">
                        Subscribe to a plan to get more credits.
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate("/subscription")}
                      className="mt-4"
                    >
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
