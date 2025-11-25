"use client";

import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-base-300">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                activeTab === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-base-content/60 hover:text-base-content hover:bg-base-100"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                activeTab === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-base-content/60 hover:text-base-content hover:bg-base-100"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {activeTab === "login" ? (
              <LoginForm onSwitchToRegister={() => setActiveTab("register")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setActiveTab("login")} />
            )}
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-center text-sm text-base-content/60">
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
