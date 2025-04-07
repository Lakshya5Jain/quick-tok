
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CreditCard, Sparkles } from "lucide-react";
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
    features: ["1,000 credits per month", "Generate up to 10 videos", "Basic support"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 20,
    credits: 2000,
    features: ["2,000 credits per month", "Generate up to 20 videos", "Priority support"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 30,
    credits: 3000,
    features: ["3,000 credits per month", "Generate up to 30 videos", "Premium support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 50,
    credits: 5000,
    features: ["5,000 credits per month", "Unlimited videos", "Enterprise support"],
  },
];

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { credits, subscription } = useCredits();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error("You must be logged in to subscribe");
      navigate("/auth");
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

  const isSubscribed = subscription?.active || false;
  const currentPlan = subscription?.plan_type || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black px-4 pb-16">
      <div className="container max-w-6xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
          {isSubscribed && (
            <Button
              onClick={() => navigate("/subscription-management")}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Manage Subscription
            </Button>
          )}
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex"
            >
              <Card
                className={`w-full flex flex-col ${
                  plan.popular
                    ? "border-quicktok-orange bg-gradient-to-b from-zinc-900/50 to-black"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
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
                <CardContent className="flex-grow">
                  <p className="text-quicktok-orange font-semibold mb-4">
                    {plan.credits.toLocaleString()} credits per month
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-1" />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading !== null || (isSubscribed && currentPlan === plan.id)}
                    className={`w-full ${
                      plan.popular
                        ? "bg-quicktok-orange hover:bg-quicktok-orange/90"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    {isLoading === plan.id && (
                      <div className="spinner mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSubscribed && currentPlan === plan.id
                      ? "Current Plan"
                      : "Subscribe"}
                    {!isLoading && !(isSubscribed && currentPlan === plan.id) && (
                      <ChevronRight className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-zinc-800">
              <Sparkles className="h-6 w-6 text-quicktok-orange" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Free Credits</h3>
              <p className="text-zinc-400 mt-1">
                Every account starts with 100 free credits, and we'll add 100 more credits to your account every month, even without a subscription!
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
      </div>
    </div>
  );
};

export default SubscriptionPlans;
