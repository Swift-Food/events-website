"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { RegisterDto } from "@/types/user";

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

  // Password validation helper
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const allMet = Object.values(requirements).every((req) => req);
    return { requirements, allMet };
  };

  const passwordValidation = validatePassword(formData.password);

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
              className="text-base-content/70 hover:text-base-content transition-colors p-1 -ml-1"
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
          <h2 className="text-2xl font-bold text-neutral">
            {step === "register" && "Create Account"}
            {step === "verify" && "Verify Your Email"}
          </h2>
        </div>
        <p className="text-sm text-base-content/70">
          {step === "register" && "Enter your details to get started"}
          {step === "verify" && "Enter the code we sent to your email"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Register */}
      {step === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-base-300 rounded-lg focus:outline-none focus:border-primary bg-white transition-colors"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral mb-2">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-base-300 rounded-lg focus:outline-none focus:border-primary bg-white transition-colors"
              placeholder="johndoe"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral mb-2">
              Organization Name (Optional)
            </label>
            <input
              name="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-base-300 rounded-lg focus:outline-none focus:border-primary bg-white transition-colors"
              placeholder="Your Organization"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral mb-2">
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
                className="w-full px-4 py-3 pr-12 border-2 border-base-300 rounded-lg focus:outline-none focus:border-primary bg-white transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
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
            {passwordTouched && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-base-content/70">
                  Password must contain:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.minLength ? (
                      <svg
                        className="w-4 h-4 text-success flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-base-content/30 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.minLength
                          ? "text-success"
                          : "text-base-content/50"
                      }`}
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasUpperCase ? (
                      <svg
                        className="w-4 h-4 text-success flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-base-content/30 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasUpperCase
                          ? "text-success"
                          : "text-base-content/50"
                      }`}
                    >
                      One uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasLowerCase ? (
                      <svg
                        className="w-4 h-4 text-success flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-base-content/30 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasLowerCase
                          ? "text-success"
                          : "text-base-content/50"
                      }`}
                    >
                      One lowercase letter (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasNumber ? (
                      <svg
                        className="w-4 h-4 text-success flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-base-content/30 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasNumber
                          ? "text-success"
                          : "text-base-content/50"
                      }`}
                    >
                      One number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.requirements.hasSpecialChar ? (
                      <svg
                        className="w-4 h-4 text-success flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-base-content/30 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-xs ${
                        passwordValidation.requirements.hasSpecialChar
                          ? "text-success"
                          : "text-base-content/50"
                      }`}
                    >
                      One special character (!@#$%^&*...)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold py-3 px-4 rounded-lg transition-all shadow-md bg-primary hover:bg-primary/90 text-primary-content hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}

      {/* Step 2: Verify */}
      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <p className="text-sm text-base-content/70 mb-6 text-center">
              We sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
            <label className="block text-sm font-medium text-neutral mb-2 text-center">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-base-300 rounded-lg focus:outline-none focus:border-primary bg-white text-center text-2xl tracking-widest"
              placeholder="000000"
              disabled={isLoading}
            />
          </div>
          {successMessage && (
            <div className="bg-success/10 border border-success/20 text-success text-sm p-3 rounded-lg">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold py-3 px-4 rounded-lg transition-all shadow-md bg-primary hover:bg-primary/90 text-primary-content hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
        <p className="text-center mt-6 text-sm text-base-content/70">
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
