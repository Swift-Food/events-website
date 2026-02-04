"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./authApi";
import { toast } from "sonner";
import { getSafeRedirectUrl } from "../utils/safeRedirect";

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
        oauth2: {
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
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
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOAuth({
  isRegister = false,
  inviteToken,
  inviteType,
  redirectTo,
  onSuccess,
  onError,
}: UseOAuthOptions = {}) {
  const router = useRouter();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isAppleLoaded, setIsAppleLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const codeClientRef = useRef<{ requestCode: () => void } | null>(null);

  // Initialize Google Sign-In

  const handleGoogleCallback = useCallback(async (response: any) => {

    setIsLoading(true);
    try {
      const code = response.code;

      let result;
      if (isRegister) {
        result = await authApi.googleRegister(code, inviteToken, inviteType);
      } else {
        result = await authApi.googleLogin(code, inviteToken, inviteType);
      }
  
      localStorage.setItem("auth_token", result.access_token);
      localStorage.setItem("refresh_token", result.refresh_token);
  
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
        router.push(getSafeRedirectUrl(redirectTo));
      }

      window.location.href = getSafeRedirectUrl(redirectTo);
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
  }, [isRegister, inviteToken, inviteType, redirectTo, onSuccess, onError, router]);
  
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.oauth2 && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        try {
          const client = window.google.accounts.oauth2.initCodeClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            ux_mode: "popup",
            callback: handleGoogleCallback,
          });
          codeClientRef.current = client;
          setIsGoogleLoaded(true);
        } catch (error) {
          console.error("Failed to initialize Google Sign-In:", error);
        }
      }
    };

    if (window.google?.accounts?.oauth2) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          initializeGoogle();
          clearInterval(checkGoogle);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [handleGoogleCallback]);

  // Initialize Apple Sign-In
  useEffect(() => {
    const initializeApple = () => {
      if (window.AppleID?.auth && process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) {
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
  

  // Trigger Google Sign-In
  const signInWithGoogle = () => {
    if (!isGoogleLoaded || !codeClientRef.current) {
      toast.error("Google Sign-In is not ready yet. Please try again.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      toast.error("Google Sign-In is not configured.");
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return;
    }

    try {
      codeClientRef.current.requestCode();
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
        router.push(getSafeRedirectUrl(redirectTo));
      }

      // Force reload to update auth context
      window.location.href = getSafeRedirectUrl(redirectTo);
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
