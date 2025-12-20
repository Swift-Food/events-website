"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./authApi";
import { toast } from "sonner";

// Google Sign-In types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: () => Promise<any>;
      };
    };
  }
}

interface UseOAuthOptions {
  isRegister?: boolean;
  inviteToken?: string;
  inviteType?: "collaborator" | "ticket";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOAuth({
  isRegister = false,
  inviteToken,
  inviteType,
  onSuccess,
  onError,
}: UseOAuthOptions = {}) {
  const router = useRouter();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isAppleLoaded, setIsAppleLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
          });
          setIsGoogleLoaded(true);
        } catch (error) {
          console.error("Failed to initialize Google Sign-In:", error);
        }
      }
    };

    // Check if Google script is already loaded
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogle();
          clearInterval(checkGoogle);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, []);

  // Initialize Apple Sign-In
  useEffect(() => {
    const initializeApple = () => {
      if (window.AppleID?.auth) {
        try {
          window.AppleID.auth.init({
            clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
            scope: "name email",
            redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
            usePopup: true,
          });
          setIsAppleLoaded(true);
        } catch (error) {
          console.error("Failed to initialize Apple Sign-In:", error);
        }
      }
    };

    // Check if Apple script is already loaded
    if (window.AppleID?.auth) {
      initializeApple();
    } else {
      // Wait for script to load
      const checkApple = setInterval(() => {
        if (window.AppleID?.auth) {
          initializeApple();
          clearInterval(checkApple);
        }
      }, 100);

      return () => clearInterval(checkApple);
    }
  }, []);

  // Handle Google OAuth callback
  const handleGoogleCallback = async (response: any) => {
    setIsLoading(true);
    try {
      const idToken = response.credential;

      let result;
      if (isRegister) {
        result = await authApi.googleRegister(idToken, inviteToken, inviteType);
      } else {
        result = await authApi.googleLogin(idToken, inviteToken, inviteType);
      }

      // Store tokens in localStorage
      localStorage.setItem("auth_token", result.access_token);
      localStorage.setItem("refresh_token", result.refresh_token);

      // Fetch user profile
      const user = await authApi.getProfile();
      localStorage.setItem("user_data", JSON.stringify(user));

      toast.success(
        isRegister
          ? "Successfully registered with Google!"
          : "Successfully signed in with Google!"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }

      // Force reload to update auth context
      window.location.href = "/";
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      const errorMessage =
        error.response?.data?.message ||
        `Failed to ${isRegister ? "register" : "sign in"} with Google`;
      toast.error(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google Sign-In
  const signInWithGoogle = () => {
    if (!isGoogleLoaded) {
      toast.error("Google Sign-In is not ready yet. Please try again.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      toast.error("Google Sign-In is not configured.");
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return;
    }

    try {
      window.google?.accounts.id.prompt();
    } catch (error) {
      console.error("Failed to trigger Google Sign-In:", error);
      toast.error("Failed to open Google Sign-In");
    }
  };

  // Trigger Apple Sign-In
  const signInWithApple = async () => {
    if (!isAppleLoaded) {
      toast.error("Apple Sign-In is not ready yet. Please try again.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) {
      toast.error("Apple Sign-In is not configured.");
      console.error("NEXT_PUBLIC_APPLE_CLIENT_ID is not set");
      return;
    }

    setIsLoading(true);
    try {
      const data = await window.AppleID!.auth.signIn();
      const idToken = data.authorization.id_token;

      let result;
      if (isRegister) {
        result = await authApi.appleRegister(idToken, inviteToken, inviteType);
      } else {
        result = await authApi.appleLogin(idToken, inviteToken, inviteType);
      }

      // Store tokens in localStorage
      localStorage.setItem("auth_token", result.access_token);
      localStorage.setItem("refresh_token", result.refresh_token);

      // Fetch user profile
      const user = await authApi.getProfile();
      localStorage.setItem("user_data", JSON.stringify(user));

      toast.success(
        isRegister
          ? "Successfully registered with Apple!"
          : "Successfully signed in with Apple!"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }

      // Force reload to update auth context
      window.location.href = "/";
    } catch (error: any) {
      console.error("Apple OAuth error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.error ||
        `Failed to ${isRegister ? "register" : "sign in"} with Apple`;
      toast.error(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    isGoogleLoaded,
    isAppleLoaded,
    isLoading,
  };
}
