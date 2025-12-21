"use client";

import { useCallback, useEffect, useState } from "react";
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

  // Initialize Google Sign-In

  const handleGoogleCallback = useCallback(async (response: any) => {
    console.log("Google callback fired!", response);
    setIsLoading(true);
    try {
      const idToken = response.credential;
  
      let result;
      if (isRegister) {
        result = await authApi.googleRegister(idToken, inviteToken, inviteType);
      } else {
        result = await authApi.googleLogin(idToken, inviteToken, inviteType);
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
        router.push(redirectTo || "/");
      }
  
      window.location.href = redirectTo || "/";
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
      if (window.google?.accounts?.id && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback, // Fresh reference each time
            auto_select: false,
          });
          setIsGoogleLoaded(true);
          console.log("Google initialized with fresh callback");
        } catch (error) {
          console.error("Failed to initialize Google Sign-In:", error);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogle();
          clearInterval(checkGoogle);
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [isRegister, inviteToken, inviteType, redirectTo, handleGoogleCallback, onSuccess, onError]); // Add all dependencies

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
    console.log("trying to login with google")
    console.log("Client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
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
        router.push(redirectTo || "/");
      }

      // Force reload to update auth context
      window.location.href = redirectTo || "/";
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
