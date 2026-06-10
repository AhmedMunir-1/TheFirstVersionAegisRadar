import { useEffect, useRef } from "react";
import { signalRService } from "@/services/signalRService";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAlertStore } from "@/store/alertStore";
import { useAuthStore } from "@/store/authStore";

export function useSignalR(): void {
  const authToken = useAuthStore((state) => state.token);
  const dashboardStore = useDashboardStore();
  const alertStore = useAlertStore();
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    let unsubscribeTransaction: (() => void) | undefined;
    let unsubscribeAlert: (() => void) | undefined;
    let unsubscribeDashboardRefresh: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;

    const transactionBuffer = useRef<any[]>([]);
    const alertBuffer = useRef<any[]>([]);

    const setupSignalR = async () => {
      try {
        // Connect to SignalR
        await signalRService.connect();
        dashboardStore.setSignalRStatus("Connected");

        // Flush transaction buffer every 500ms for a more "live" feel
        flushIntervalRef.current = setInterval(() => {
          if (transactionBuffer.current.length > 0) {
            const batch = [...transactionBuffer.current];
            transactionBuffer.current = [];
            const { addTransaction, updateCurrentMinuteBucket } = useDashboardStore.getState();
            batch.forEach((tx) => {
              addTransaction(tx);
              updateCurrentMinuteBucket(tx);
            });
          }
          if (alertBuffer.current.length > 0) {
            const batch = [...alertBuffer.current];
            alertBuffer.current = [];
            const { addAlert } = useAlertStore.getState();
            batch.forEach((alert) => addAlert(alert));
          }
        }, 500);

        // Subscribe to TransactionUpdated (real backend event)
        unsubscribeTransaction = signalRService.onTransactionProcessed((transaction) => {
          console.log("📨 SignalR TransactionUpdated received:", transaction.id);
          transactionBuffer.current.push(transaction);
        });

        // Subscribe to FraudAlertReceived (real backend event)
        unsubscribeAlert = signalRService.onAlertCreated((alert) => {
          console.log("🔔 SignalR FraudAlertReceived:", alert.id);
          alertBuffer.current.push(alert);
        });

        // Subscribe to DashboardRefresh (real backend event)
        unsubscribeDashboardRefresh = signalRService.onDashboardRefresh(() => {
          console.log("🔄 DashboardRefresh received");
          if (!isRefreshingRef.current) {
            isRefreshingRef.current = true;
            dashboardStore.loadInitialData().catch(console.error).finally(() => {
              isRefreshingRef.current = false;
            });
          }
        });

        unsubscribeStatus = signalRService.onConnectionStatusChanged((status) => {
          console.log("SignalR status:", status);
          dashboardStore.setSignalRStatus(status);

          // Only refresh data on reconnect (avoid multiple refreshes)
          // AND only if we haven't refreshed in the last 5 seconds
          if (status === "Connected" && !isRefreshingRef.current) {
            const now = Date.now();
            if (now - lastRefreshRef.current > 5000) {
              isRefreshingRef.current = true;
              dashboardStore.loadInitialData().catch(console.error).finally(() => {
                isRefreshingRef.current = false;
                lastRefreshRef.current = now;
              });
            }
          }
        });
      } catch (error) {
        console.error("Failed to setup SignalR:", error);
        dashboardStore.setSignalRStatus("Disconnected");
      }
    };

    setupSignalR();

    return () => {
      signalRService.disconnect().catch(console.error);
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
      unsubscribeTransaction?.();
      unsubscribeAlert?.();
      unsubscribeDashboardRefresh?.();
      unsubscribeStatus?.();
    };
  }, [authToken, dashboardStore, alertStore]);
}
