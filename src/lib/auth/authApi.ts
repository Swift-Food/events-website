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
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const payload: LoginDto = {
      email,
      password,
    };
    const response = await apiClient.post<LoginResponse>(
      "/auth/corporate-login",
      payload
    );
    return response.data;
  },

  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register-corporate",
      data
    );
    return response.data;
  },

  /**
   * Verify corporate email with code
   */
  verifyEmail: async (
    email: string,
    code: string,
    organizationName?: string
  ): Promise<VerifyEmailResponse> => {
    const payload: VerifyEmailDto = { email, code, organizationName };
    const response = await apiClient.post<VerifyEmailResponse>(
      "/auth/verify-corporate-email",
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
    const response = await apiClient.get<User>("/auth/profile");
    console.log("Getting profile: ", response);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<TokenPair> => {
    const response = await apiClient.post<TokenPair>("/auth/refresh-consumer", {
      refresh_token: refreshToken,
    });
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
