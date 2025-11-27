"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import { toast } from "sonner";

type AuthView =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "verify-email";

export default function AuthPage() {
  const router = useRouter();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-card-background rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Tabs */}
          {/* <div className="flex border-b border-foreground/10">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                activeTab === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                activeTab === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Sign Up
            </button>
          </div> */}

          {/* Form Content */}
          <div className="p-8">
            {authView === "login" && (
              <LoginForm
                onSwitchToRegister={() => setAuthView("register")}
                onForgotPassword={() => setAuthView("forgot-password")}
                onNeedsVerification={(email) => {
                  setVerifyEmail(email);
                  setAuthView("verify-email");
                }}
              />
            )}

            {authView === "register" && (
              <RegisterForm onSwitchToLogin={() => setAuthView("login")} />
            )}

            {authView === "forgot-password" && (
              <ForgotPasswordForm
                onSuccess={(email) => {
                  setResetEmail(email);
                  setAuthView("reset-password");
                }}
                onBack={() => setAuthView("login")}
              />
            )}

            {authView === "reset-password" && (
              <ResetPasswordForm
                email={resetEmail}
                onSuccess={() => {
                  toast.success(
                    "Password reset successfully! You can now log in."
                  );
                  setAuthView("login");
                }}
                onBack={() => setAuthView("forgot-password")}
              />
            )}

            {authView === "verify-email" && (
              <VerifyEmailForm
                email={verifyEmail}
                onSuccess={() => {
                  toast.success("Email verified! Please log in.");
                  setAuthView("login");
                }}
                onBack={() => setAuthView("login")}
              />
            )}
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          By signing in or creating an account, you agree to our{" "}
          <a href="#" className="text-primary hover:text-primary/80 font-medium">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:text-primary/80 font-medium">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
