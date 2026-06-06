import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/services/apiClient";
import { signalRService } from "@/services/signalRService";
import type {
  LoginResponse,
  MerchantProfileDto,
  RegisterRequest,
} from "@/types/api";

interface AuthState {
  token: string | null;
  merchantId: string | null;
  email: string | null;
  companyName: string | null;
  merchantProfile: MerchantProfileDto | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (dto: RegisterRequest) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      merchantId: null,
      email: null,
      companyName: null,
      merchantProfile: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.auth.login(email, password);
          set({
            token: response.token,
            merchantId: response.merchantId,
            email: response.email,
            companyName: response.companyName,
            isLoading: false,
          });
          // Connect to SignalR after login
          await signalRService.connect();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (dto: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.auth.register(dto);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          });
          throw error;
        }
      },

      verify: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.auth.verify(email, code);
          set({
            token: response.token,
            merchantId: response.merchantId,
            email: response.email,
            companyName: response.companyName,
            isLoading: false,
          });
          // Connect to SignalR after verification
          await signalRService.connect();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Verification failed",
            isLoading: false,
          });
          throw error;
        }
      },

      loadProfile: async () => {
        const { token } = get();
        if (!token) {
          set({ error: "Not authenticated" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const profile = await apiClient.merchants.getMe();
          set({ merchantProfile: profile, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load profile",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        apiClient.auth.logout();
        signalRService.disconnect();
        set({
          token: null,
          merchantId: null,
          email: null,
          companyName: null,
          merchantProfile: null,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        token: state.token,
        merchantId: state.merchantId,
        email: state.email,
        companyName: state.companyName,
      }),
    }
  )
);
