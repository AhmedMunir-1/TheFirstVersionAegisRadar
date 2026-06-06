import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { apiClient } from "@/services/apiClient";
import type { AlertDto } from "@/types/api";

interface AlertState {
  alerts: AlertDto[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAlerts: (unreadOnly?: boolean) => Promise<void>;
  addAlert: (alert: AlertDto) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeAlert: (id: string) => void;
  clearError: () => void;
}

export const useAlertStore = create<AlertState>()(
  immer((set, get) => ({
    alerts: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    loadAlerts: async (unreadOnly = false) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const alerts = await apiClient.alerts.getAll(unreadOnly);
        set((state) => {
          state.alerts = alerts;
          state.unreadCount = alerts.filter((a) => !a.isRead).length;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to load alerts";
          state.isLoading = false;
        });
        throw error;
      }
    },

    addAlert: (alert: AlertDto) => {
      set((state) => {
        state.alerts.unshift(alert);
        if (!alert.isRead) {
          state.unreadCount += 1;
        }
        // Keep max 100 alerts
        if (state.alerts.length > 100) {
          state.alerts.pop();
        }
      });
    },

    markRead: async (id: string) => {
      const alert = get().alerts.find((a) => a.id === id);
      if (!alert) return;

      try {
        await apiClient.alerts.markRead(id);
        set((state) => {
          const idx = state.alerts.findIndex((a) => a.id === id);
          if (idx !== -1) {
            if (!state.alerts[idx].isRead) {
              state.unreadCount -= 1;
            }
            state.alerts[idx].isRead = true;
          }
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to mark alert read";
        });
        throw error;
      }
    },

    markAllRead: async () => {
      try {
        await apiClient.alerts.markAllRead();
        set((state) => {
          state.alerts.forEach((alert) => {
            alert.isRead = true;
          });
          state.unreadCount = 0;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to mark all alerts read";
        });
        throw error;
      }
    },

    removeAlert: (id: string) => {
      set((state) => {
        const idx = state.alerts.findIndex((a) => a.id === id);
        if (idx !== -1) {
          if (!state.alerts[idx].isRead) {
            state.unreadCount -= 1;
          }
          state.alerts.splice(idx, 1);
        }
      });
    },

    clearError: () => set((state) => {
      state.error = null;
    }),
  }))
);
