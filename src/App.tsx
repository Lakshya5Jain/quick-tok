
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AuthProvider from "./context/AuthContext";
import { CreditsProvider } from "./context/CreditsContext";
import { RequireAuth } from "./components/auth/RequireAuth";
import HomePage from "./components/HomePage";
import LoadingPage from "./pages/LoadingPage";
import ResultPage from "./pages/ResultPage";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancelled from "./pages/SubscriptionCancelled";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CreditsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/create" element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              } />
              <Route path="/loading" element={
                <RequireAuth>
                  <LoadingPage />
                </RequireAuth>
              } />
              <Route path="/result" element={
                <RequireAuth>
                  <ResultPage />
                </RequireAuth>
              } />
              <Route path="/subscription" element={
                <RequireAuth>
                  <SubscriptionPlans />
                </RequireAuth>
              } />
              <Route path="/subscription-success" element={
                <RequireAuth>
                  <SubscriptionSuccess />
                </RequireAuth>
              } />
              <Route path="/subscription-cancelled" element={
                <RequireAuth>
                  <SubscriptionCancelled />
                </RequireAuth>
              } />
              <Route path="/dashboard" element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CreditsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
