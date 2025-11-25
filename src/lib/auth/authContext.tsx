"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  AuthState,
  User,
  TokenPair,
  LoginDto,
  LoginResponse,
  RegisterDto,
  RegisterResponse,
  VerifyEmailDto,
  VerifyEmailResponse,
} from "@/types/user";
import { authApi } from "./authApi";

interface AuthContextType extends AuthState {
  login: (credentials: LoginDto) => Promise<LoginResponse>;
  register: (data: RegisterDto) => Promise<RegisterResponse>;
  verifyEmail: (data: VerifyEmailDto) => Promise<VerifyEmailResponse>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const USER_STORAGE_KEY = "user_data";

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  const payload = authApi.decodeJWT(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    eventUser: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setAuthData = useCallback((tokenPair: TokenPair, user: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenPair.access_token);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokenPair.refresh_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    setState({
      user,
      eventUser: null,
      token: tokenPair.access_token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    setState({
      user: null,
      eventUser: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await authApi.refreshToken(storedRefreshToken);

      // Decode the token to get user info
      const payload = authApi.decodeJWT(response.access_token);
      if (payload) {
        const user: User = {
          id: payload.sub,
          email: payload.email,
          verified: payload.verified,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setAuthData(response, user);
      }
    } catch (error) {
      logout();
      throw error;
    }
  }, [setAuthData, logout]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser && !isTokenExpired(storedToken)) {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            eventUser: null,
            token: storedToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } else if (storedToken && isTokenExpired(storedToken)) {
          // Try to refresh the token
          try {
            await refreshToken();
          } catch (error) {
            console.error(error)
            // If refresh fails, clear everything
            logout();
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [refreshToken, logout]);

  const login = async (credentials: LoginDto): Promise<LoginResponse> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.login(
        credentials.email,
        credentials.password
      );

      // Check if response is a TokenPair (successful login) or needs verification
      if ("access_token" in response) {
        // Decode the token to get user info
        const payload = authApi.decodeJWT(response.access_token);
        if (payload) {
          const user: User = {
            id: payload.sub,
            email: payload.email,
            verified: payload.verified,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setAuthData(response, user);
        }
      } else {
        // Needs verification
        setState((prev) => ({ ...prev, isLoading: false }));
      }

      return response;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (data: RegisterDto): Promise<RegisterResponse> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.register(data);
      setState((prev) => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const verifyEmail = async (
    data: VerifyEmailDto
  ): Promise<VerifyEmailResponse> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.verifyEmail(
        data.code,
        data.email,
        data.organizationName
      );

      // Decode the token to get user info
      const payload = authApi.decodeJWT(response.tokenPair.access_token);
      if (payload) {
        const user: User = {
          id: payload.sub,
          email: payload.email,
          verified: payload.verified,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setAuthData(response.tokenPair, user);
      }

      return response;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const updateUser = (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setState((prev) => ({
      ...prev,
      user,
    }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    verifyEmail,
    logout,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext };
