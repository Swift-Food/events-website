"use client";

import { useState } from "react";
import { authApi } from "@/lib/auth/authApi";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export default function ForgotPasswordForm({
  onSuccess,
  onBack,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      toast.success("Reset code sent! Check your email.");
      onSuccess(email);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to send reset code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            Forgot Password
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          Enter your email address and we&apos;ll send you a code to reset your
          password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Reset Code"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Back to login
        </button>
      </form>
    </div>
  );
}
