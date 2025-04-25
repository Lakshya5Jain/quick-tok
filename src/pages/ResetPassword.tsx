import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Parse tokens and set session on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let accessToken = searchParams.get("access_token");
    let refreshToken = searchParams.get("refresh_token");
    if (!accessToken) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      accessToken = hashParams.get("access_token");
      refreshToken = hashParams.get("refresh_token");
    }
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            toast.error(error.message);
            navigate("/auth");
          }
        });
    } else {
      toast.error("Invalid password reset link.");
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" onClick={() => navigate("/")} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Reset Your Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-quicktok-orange hover:bg-quicktok-orange/90 text-white"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword; 