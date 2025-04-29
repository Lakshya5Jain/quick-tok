import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, CreditCard, Gem, History, RefreshCw, Video } from "lucide-react";
import { useCredits } from "@/context/CreditsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";

const Dashboard = () => {
  const navigate = useNavigate();
  const { credits, loading, subscription, transactions, refreshCredits } = useCredits();
  const { user } = useAuth();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return "text-green-500";
    return "text-red-500";
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION":
      case "RENEWAL":
        return <CreditCard className="h-4 w-4" />;
      case "INITIAL":
      case "MONTHLY_RESET":
        return <RefreshCw className="h-4 w-4" />;
      case "VIDEO_GENERATION":
        return <Video className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary px-4 pb-16">
      <div className="max-w-7xl mx-auto pt-8">
        <Navbar
          activeTab="dashboard"
          onTabChange={(tab) => {
            if (tab === "generate") {
              navigate("/create");
            } else if (tab === "videos") {
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
            key="dashboard-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              {user?.email && (
                <p className="text-zinc-300 mt-1 text-sm">Signed in as <span className="font-semibold">{user.email}</span></p>
              )}
              <p className="text-zinc-400 mt-2">
                Manage your credits, subscription, and video usage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Credits Card */}
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gem className="h-5 w-5 text-quicktok-orange" />
                    Available Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse"></div>
                  ) : (
                    <div className="text-3xl font-bold text-white">{credits?.toLocaleString() || 0}</div>
                  )}
                  <Button
                    className="mt-4 bg-quicktok-orange hover:bg-quicktok-orange/90 text-white"
                    asChild
                  >
                    <Link to="/subscription">Get More Credits</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Card */}
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-quicktok-orange" />
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-8 w-full bg-zinc-800 rounded animate-pulse"></div>
                  ) : subscription?.active ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xl font-semibold text-white capitalize">
                            {subscription.plan_type} Plan
                          </div>
                          <div className="text-sm text-zinc-400">
                            {subscription.monthly_credits.toLocaleString()} credits monthly
                          </div>
                          {subscription.cancel_at_period_end && (
                            <div className="text-xs text-amber-500 mt-1">
                              Cancels at period end
                            </div>
                          )}
                        </div>
                        <Button
                          className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white"
                          asChild
                        >
                          <Link to="/subscription">Change</Link>
                        </Button>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                          <span>Renews on</span>
                          <span>{formatDate(subscription.current_period_end)}</span>
                        </div>
                        {(() => {
                          const now = new Date();
                          const periodStart = new Date(subscription.current_period_start);
                          const periodEnd = new Date(subscription.current_period_end);
                          const total = periodEnd.getTime() - periodStart.getTime();
                          const left = periodEnd.getTime() - now.getTime();
                          const percent = Math.max(0, Math.min(100, (left / total) * 100));
                          return (
                            <Progress
                              value={percent}
                              className="h-1 bg-zinc-800"
                              indicatorClassName="bg-quicktok-orange"
                            />
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-zinc-400">No active subscription</p>
                      <Button
                        className="mt-3 bg-quicktok-orange hover:bg-quicktok-orange/90"
                        asChild
                      >
                        <Link to="/subscription">Subscribe Now</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Free Credits Info */}
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-quicktok-orange" />
                    Free Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">
                    Your account receives 100 free credits automatically every month.
                  </p>
                  <div className="mt-4 text-xs text-zinc-500">
                    Use them or save them - credits roll over!
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-zinc-900/40 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
                <CardDescription>History of your credit changes</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-zinc-500 py-4 text-center">No transactions yet</p>
                ) : (
                  <div className="space-y-1">
                    {transactions.map(transaction => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-2 px-2 rounded hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            {getTransactionIcon(transaction.transaction_type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-zinc-200">
                              {transaction.description}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {formatDate(transaction.created_at)}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`font-semibold ${getTransactionColor(
                            transaction.transaction_type,
                            transaction.amount
                          )}`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 text-center">
                  <Button
                    className="bg-quicktok-orange hover:bg-quicktok-orange/90 text-white"
                    onClick={() => refreshCredits()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
