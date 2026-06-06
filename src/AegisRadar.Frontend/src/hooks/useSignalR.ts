import { useEffect } from "react";
import { signalRService } from "@/services/signalRService";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAlertStore } from "@/store/alertStore";
import { useAuthStore } from "@/store/authStore";

export function useSignalR(): void {
  const authToken = useAuthStore((state) => state.token);
  const dashboardStore = useDashboardStore();
  const alertStore = useAlertStore();

  useEffect(() => {
    if (!authToken) {
      return;
    }

    let unsubscribeTransaction: (() => void) | undefined;
    let unsubscribeFraudDetected: (() => void) | undefined;
    let unsubscribeAlert: (() => void) | undefined;
    let unsubscribeResolved: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;

    const setupSignalR = async () => {
      try {
        // Connect to SignalR
        await signalRService.connect();
        dashboardStore.setSignalRStatus("Connected");

        // Subscribe to events
        unsubscribeTransaction = signalRService.onTransactionProcessed((transaction) => {
          console.log("📊 TransactionProcessed:", transaction.id);
          dashboardStore.addTransaction(transaction);
          dashboardStore.updateCurrentMinuteBucket(transaction);
        });

        unsubscribeFraudDetected = signalRService.onFraudDetected((data) => {
          console.log("🚨 FraudDetected:", data.transactionId);
          dashboardStore.updateTransaction(data.transactionId, {
            prediction: {
              fraudProbability: data.fraudProbability,
              decision: data.decision,
              modelVersion: "1.0.0",
              createdAt: new Date().toISOString(),
            },
          });
        });

        unsubscribeAlert = signalRService.onAlertCreated((alert) => {
          console.log("🔔 AlertCreated:", alert.id);
          alertStore.addAlert(alert);
        });

        unsubscribeResolved = signalRService.onTransactionResolved((data) => {
          console.log("✅ TransactionResolved:", data.transactionId);
          dashboardStore.updateTransaction(data.transactionId, {
            status: data.status,
          });
        });

        unsubscribeStatus = signalRService.onConnectionStatusChanged((status) => {
          console.log("SignalR status:", status);
          dashboardStore.setSignalRStatus(status);

          // On reconnect, refetch initial data
          if (status === "Connected") {
            dashboardStore.loadInitialData().catch(console.error);
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
      unsubscribeTransaction?.();
      unsubscribeFraudDetected?.();
      unsubscribeAlert?.();
      unsubscribeResolved?.();
      unsubscribeStatus?.();
    };
  }, [authToken, dashboardStore, alertStore]);
}

