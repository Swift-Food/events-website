"use client";

import { useState } from "react";
import { authApi } from "@/lib/auth/authApi";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface VerifyEmailFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
  onResend?: () => void;
}

export default function VerifyEmailForm({
  email,
  onSuccess,
  onBack,
  onResend,
}: VerifyEmailFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authApi.verifyEmail(email, code);
      toast.success("Email verified successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Verification error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to verify email";
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
            Verify Your Email
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          We sent a 6-digit code to {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground text-center text-2xl tracking-widest shadow-inner"
            placeholder="000000"
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
          {isLoading ? "Verifying..." : "Verify Email"}
        </button>

        {onResend && (
          <button
            type="button"
            onClick={onResend}
            className="w-full text-sm text-primary hover:text-primary/80"
          >
            Resend Code
          </button>
        )}

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
