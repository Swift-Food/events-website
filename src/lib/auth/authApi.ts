import apiClient from "./apiClient";
import {
  LoginDto,
  LoginResponse,
  RegisterDto,
  RegisterResponse,
  VerifyEmailDto,
  VerifyEmailResponse,
  TokenPair,
  User,
} from "@/types/user";

export const authApi = {
  login: async (
    email: string,
    password: string,
    inviteToken?: string,
    inviteType?: 'collaborator' | 'ticket'
  ): Promise<LoginResponse> => {
    const payload: LoginDto = {
      email,
      password,
      inviteToken,
      inviteType,
    };
    const response = await apiClient.post<LoginResponse>(
      "/auth/login-event-user",
      payload
    );
    return response.data;
  },

  register: async (
    data: RegisterDto,
    inviteToken?: string,
    inviteType?: 'collaborator' | 'ticket'
  ): Promise<RegisterResponse> => {
    const payload = {
      ...data,
      inviteToken,
      inviteType,
    };
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register-event-user",
      payload
    );
    return response.data;
  },

  /**
   * Verify email with code
   */
  verifyEmail: async (
    email: string,
    code: string,
    organizationName?: string,
    inviteToken?: string,
    inviteType?: 'collaborator' | 'ticket'
  ): Promise<VerifyEmailResponse> => {
    const payload: VerifyEmailDto = {
      email,
      code,
      organizationName,
      inviteToken,
      inviteType,
    };
    const response = await apiClient.post<VerifyEmailResponse>(
      "/auth/verify-event-user",
      payload
    );
    return response.data;
  },

  /**
   * Request password reset code
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/forgot-password",
      { email }
    );
    return response.data;
  },

  /**
   * Reset password with code
   */
  resetPassword: async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      { email, code, newPassword }
    );
    return response.data;
  },

  /**
   * Get current user's profile (validates token)
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; user: User }>(
      "/auth/profile"
    );
    return response.data.user;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<TokenPair> => {
    const response = await apiClient.post<TokenPair>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  /**
   * Google Sign-In for Event Users
   */
  googleLogin: async (
    idToken: string,
    inviteToken?: string,
    inviteType?: 'collaborator' | 'ticket'
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const payload = {
      idToken,
      inviteToken,
      inviteType,
    };
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
    }>("/auth/google-login-event-user", payload);
    return response.data;
  },

  /**
   * Google Register for Event Users
   */
  googleRegister: async (
    idToken: string,
    inviteToken?: string,
    inviteType?: 'collaborator' | 'ticket'
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const payload = {
      idToken,
      inviteToken,
      inviteType,
    };
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
    }>("/auth/google-register-event-user", payload);
    return response.data;
  },

  /**
   * Decode JWT token (client-side only - for reading payload)
   */
  decodeJWT: (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  },
};
