import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CreditCard, Sparkles, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCredits } from "@/context/CreditsContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Slider } from "@/components/ui/slider";
import Footer from "@/components/Footer";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 10,
    credits: 1000,
    features: ["1,000 credits per month"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 20,
    credits: 2500,
    features: ["2,500 credits per month"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 50,
    credits: 10000,
    features: ["10,000 credits per month"],
  },
];

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { credits, subscription } = useCredits();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [additionalCredits, setAdditionalCredits] = useState<number>(100);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error("You must be logged in to subscribe");
      navigate("/auth");
      return;
    }

    // If already subscribed, redirect to manage subscription instead
    if (isSubscribed) {
      handleManageSubscription();
      return;
    }

    setIsLoading(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planId: plan.id,
          userId: user.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      toast.error("Could not start checkout process. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error("No Stripe customer ID found");
      return;
    }
    setIsLoading("manage");
    try {
      const { data, error } = await supabase.functions.invoke("create-customer-portal-session", {
        body: { 
          customerId: subscription.stripe_customer_id,
          userId: user.id
        },
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(error?.message || "No portal URL returned");
      }
    } catch (err) {
      console.error("Error creating customer portal session:", err);
      toast.error("Could not open Stripe portal");
    } finally {
      setIsLoading(null);
    }
  };

  const handleBuyAdditionalCredits = async () => {
    if (!user) {
      toast.error("You must be logged in to buy credits");
      navigate("/auth");
      return;
    }
    setIsLoading("credits");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          creditAmount: additionalCredits,
          userId: user.id,
          priceId: "price_1RJnvuGKsooHfCUlvH8u0D7T",
          isOneTime: true
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout session for credits:", err);
      toast.error("Could not start checkout process. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const isSubscribed = subscription?.active || false;
  const currentPlan = subscription?.plan_type || null;
  const isCancelling = !!subscription?.cancel_at_period_end;

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-7xl mx-auto pt-8">
        <Navbar
          activeTab="subscription"
          onTabChange={(tab) => {
            if (tab === "generate" || tab === "videos") {
              navigate("/create");
            } else if (tab === "dashboard") {
              navigate("/dashboard");
            } else if (tab === "subscription") {
              navigate("/subscription");
            }
          }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key="subscription-plans"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-white mb-4"
              >
                Choose Your Plan
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-zinc-400 max-w-2xl mx-auto"
              >
                Get the credits you need to create amazing videos.{" "}
                {credits !== null && (
                  <span className="font-bold">
                    You currently have{" "}
                    <span className="text-quicktok-orange">{credits} credits</span> available.
                  </span>
                )}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 justify-center">
              {PLANS.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-center"
                >
                  <Card
                    className={`relative w-96 flex flex-col border-zinc-800 bg-zinc-900/40`}
                  >
                    {plan.popular && (
                      <div className="bg-quicktok-orange text-white text-xs font-bold py-1 px-3 rounded-full absolute -top-3 left-1/2 transform -translate-x-1/2">
                        MOST POPULAR
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      <CardDescription>
                        <div className="text-2xl font-bold text-white mt-2">
                          ${plan.price}
                          <span className="text-sm text-zinc-400 font-normal">/month</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow text-center">
                      <p className="text-quicktok-orange font-semibold mb-4 text-lg">
                        {plan.credits.toLocaleString()} credits per month
                      </p>
                    </CardContent>
                    <CardFooter>
                      {isSubscribed && currentPlan === plan.id ? (
                        <Button
                          onClick={handleManageSubscription}
                          disabled={isLoading === "manage"}
                          className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90"
                        >
                          {isLoading === "manage" ? (
                            <div className="spinner mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Manage Subscription"
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(plan)}
                          disabled={isLoading !== null}
                          className="w-full bg-zinc-800 hover:bg-zinc-700"
                        >
                          {isLoading === plan.id && (
                            <div className="spinner mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isSubscribed ? "Switch Plan" : "Subscribe"}
                          {!isLoading && (
                            <ChevronRight className="ml-1 h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </CardFooter>
                    {isSubscribed && currentPlan === plan.id && isCancelling && (
                      <div className="px-6 pb-4 text-center">
                        <div className="text-xs text-amber-500">
                          Your subscription will cancel at the end of the current period
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Buy Additional Credits Section - Only show for subscribed users */}
            {isSubscribed && (
              <div className="mt-16 bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
                <div className="flex flex-col">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-zinc-800">
                      <Plus className="h-6 w-6 text-quicktok-orange" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Need More Credits?</h3>
                      <p className="text-zinc-400 mt-1">
                        Purchase additional credits anytime. Pay $1 for every 100 credits.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-300">Amount:</span>
                      <span className="text-quicktok-orange font-bold">
                        {additionalCredits} credits (${((additionalCredits / 100).toFixed(2))})
                      </span>
                    </div>
                    
                    <Slider
                      defaultValue={[additionalCredits]}
                      min={100}
                      max={10000}
                      step={100}
                      className="my-6"
                      onValueCommit={(value) => setAdditionalCredits(value[0])}
                    />
                    
                    <Button 
                      className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90 mt-2"
                      onClick={handleBuyAdditionalCredits}
                      disabled={isLoading === "credits"}
                    >
                      {isLoading === "credits" ? (
                        <div className="spinner mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Buy Additional Credits"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-zinc-800">
                  <Sparkles className="h-6 w-6 text-quicktok-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Free Credits</h3>
                  <p className="text-zinc-400 mt-1">
                    Every account starts with 1000 free credits, and we'll add 100 more credits to your account every month, even without a subscription!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-zinc-800">
                  <CreditCard className="h-6 w-6 text-quicktok-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Secure Payments</h3>
                  <p className="text-zinc-400 mt-1">
                    All payments are securely processed through Stripe. Your card details are never stored on our servers.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
};

export default SubscriptionPlans;
