"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { RegisterDto } from "@/types/user";
import { validatePassword } from "@/lib/utils/passwordValidation";
import PasswordRequirements from "./PasswordRequirements";
import { GoogleOAuthButton, AppleOAuthButton } from "./OAuthButtons";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const router = useRouter();
  const { register, verifyEmail } = useAuth();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    organizationName: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [userId, setUserId] = useState("");

  const passwordValidation = validatePassword(formData.password);

  // Clear verification code when navigating to verify step
  useEffect(() => {
    if (step === "verify") {
      setVerificationCode("");
      setError("");
      setSuccessMessage("");
    }
  }, [step]);

  // Step 1: Register
  const handleRegister = async (e: React.FormEvent) => {
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
      const registerData: RegisterDto = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        organizationName: formData.organizationName || undefined,
      };

      const result = await register(registerData);

      if (result.success) {
        setUserId(result.userId);
        setStep("verify");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify email
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await verifyEmail({
        email: formData.email,
        code: verificationCode,
        organizationName: formData.organizationName || undefined,
      });

      // Wipe all form data after successful verification
      setFormData({
        email: "",
        password: "",
        username: "",
        organizationName: "",
      });
      setVerificationCode("");
      setPasswordTouched(false);
      setStep("register");

      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect after successful registration and verification
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed");
      setVerificationCode(""); // Clear the code on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // Resend verification code
  const handleResendCode = async () => {
    setError("");
    setSuccessMessage("");
    setIsResending(true);

    try {
      const registerData: RegisterDto = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        organizationName: formData.organizationName || undefined,
      };

      await register(registerData);

      // Show success message
      setSuccessMessage("Verification code resent successfully!");
    } catch (err: any) {
      console.error("Resend code error: ", err);
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {step === "verify" && (
            <button
              type="button"
              onClick={() => setStep("register")}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-bold text-foreground">
            {step === "register" && "Create Account"}
            {step === "verify" && "Verify Your Email"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {step === "register" && "Enter your details to get started"}
          {step === "verify" && "Enter the code we sent to your email"}
        </p>
      </div>

      {/* Error Message - Only show on register step */}
      {error && step === "register" && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Step 1: Register */}
      {step === "register" && (
        <>
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-4">
            <GoogleOAuthButton
              isRegister={true}
              onSuccess={onSuccess}
            />
            <AppleOAuthButton
              isRegister={true}
              onSuccess={onSuccess}
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-foreground/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card-background text-muted-foreground">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner transition-colors"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner transition-colors"
              placeholder="johndoe"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Organization Name (Optional)
            </label>
            <input
              name="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner transition-colors"
              placeholder="Your Organization"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordTouched(true)}
                className="w-full px-4 py-3 pr-12 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground placeholder:text-muted-foreground/40 shadow-inner transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
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

            {/* Password Requirements */}
            <PasswordRequirements
              validation={passwordValidation}
              touched={passwordTouched}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold py-3 px-4 rounded-xl transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        </>
      )}

      {/* Step 2: Verify */}
      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              We sent a 6-digit code to <strong className="text-foreground">{formData.email}</strong>
            </p>
            <label className="block text-sm font-medium text-foreground mb-2 text-center">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-input-background text-foreground text-center text-2xl tracking-widest shadow-inner"
              placeholder="000000"
              disabled={isLoading}
            />
          </div>
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-xl">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold py-3 px-4 rounded-xl transition-all  bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="w-full text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Resend Code"}
            </button>
          </div>
        </form>
      )}

      {/* Sign in link */}
      {onSwitchToLogin && (
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Sign in
          </button>
        </p>
      )}
    </div>
  );
}
