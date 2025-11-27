"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { authApi } from "@/lib/auth/authApi";

interface LoginFormProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  onNeedsVerification?: (email: string) => void;
}

export default function LoginForm({
  onClose,
  onSwitchToRegister,
  onForgotPassword,
  onNeedsVerification,
}: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await login(loginData);

      // Check if login was successful or needs verification
      if ("access_token" in response) {
        // Successful login
        if (onClose) onClose();
        router.push("/");
      } else if ("needsVerification" in response && response.needsVerification) {
        // Needs verification - call parent callback
        if (onNeedsVerification) {
          onNeedsVerification(loginData.email);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);

      if (err.response?.data?.needsVerification) {
        // Needs verification - call parent callback
        if (onNeedsVerification) {
          onNeedsVerification(loginData.email);
        }
      } else if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.message || "Your account is not active");
      } else {
        setError(err.response?.data?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth login
    alert("Google login coming soon!");
  };

  return (
    <div className="w-full">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-border rounded-xl hover:bg-white/5 transition-colors bg-card-secondary-background"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium text-foreground">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-foreground/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card-background text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginData.email}
              onChange={handleLoginChange}
              className="w-full px-4 py-2.5 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner transition-colors"
              placeholder="you@example.com"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                className="w-full px-4 py-2.5 pr-12 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

      {/* Sign up link */}
      {onSwitchToRegister && (
        <p className="text-center mt-4 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}
