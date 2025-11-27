"use client";

import { useState } from "react";
import { authApi } from "@/lib/auth/authApi";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@/lib/utils/passwordValidation";
import PasswordRequirements from "./PasswordRequirements";

interface ResetPasswordFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function ResetPasswordForm({
  email,
  onSuccess,
  onBack,
}: ResetPasswordFormProps) {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password meets all requirements
    if (!passwordValidation.allMet) {
      setError("Password does not meet all requirements");
      setPasswordTouched(true);
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(email, code, newPassword);
      toast.success("Password reset successfully! You can now log in.");
      onSuccess();
    } catch (err: any) {
      console.error("Reset password error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to reset password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsResending(true);

    try {
      await authApi.forgotPassword(email);
      toast.success("Reset code resent! Check your email.");
    } catch (err: any) {
      console.error("Resend code error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to resend code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
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
            Reset Password
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          Enter the code we sent to {email} and your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Reset Code
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

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setPasswordTouched(true)}
              className="w-full px-4 py-3 pr-12 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          <PasswordRequirements
            validation={passwordValidation}
            touched={passwordTouched}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isResending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={isResending || isLoading}
          className="w-full text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
        >
          {isResending ? "Resending..." : "Resend Code"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Back
        </button>
      </form>
    </div>
  );
}
