import * as signalR from "@microsoft/signalr";
import type {
  TransactionResponseDto,
  AlertDto,
} from "@/types/api";

export type ConnectionStatus = "Connecting" | "Connected" | "Disconnected" | "Reconnecting";

type TransactionCallback = (transaction: TransactionResponseDto) => void;
type AlertCallback = (alert: AlertDto) => void;
type DashboardRefreshCallback = () => void;
type StatusCallback = (status: ConnectionStatus) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private connectionStatus: ConnectionStatus = "Disconnected";
  private statusCallbacks: Set<StatusCallback> = new Set();
  private transactionCallbacks: Set<TransactionCallback> = new Set();
  private alertCallbacks: Set<AlertCallback> = new Set();
  private dashboardRefreshCallbacks: Set<DashboardRefreshCallback> = new Set();

  private getMerchantIdFromToken(): string | null {
    const token = localStorage.getItem("aegis_token");
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub
          || payload.nameid
          || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
          || null;
    } catch {
      return null;
    }
  }

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      this.setStatus("Connecting");

      const token = localStorage.getItem("aegis_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const signalRUrl = import.meta.env.VITE_SIGNALR_URL || "http://localhost:5099/hubs/fraud-alerts";

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRUrl, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: false,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000, 60000])
        .withServerTimeout(30000)
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.onreconnecting(() => {
        console.warn("SignalR: Reconnecting...");
        this.setStatus("Reconnecting");
      });

      this.connection.onreconnected(async () => {
        console.log("SignalR: Reconnected successfully");
        this.setStatus("Connected");
        // Re-join merchant group on reconnect
        const merchantId = this.getMerchantIdFromToken();
        if (merchantId && this.connection) {
          try {
            await this.connection.invoke("JoinMerchantGroup", merchantId);
          } catch (err) {
            console.warn("Failed to rejoin merchant group:", err);
          }
        }
      });

      this.connection.onclose(() => {
        console.warn("SignalR: Connection closed");
        this.setStatus("Disconnected");
      });

      // Real event: transaction updated (from PredictionConsumerService)
      this.connection.on("TransactionUpdated", (transaction: TransactionResponseDto) => {
        this.transactionCallbacks.forEach((cb) => cb(transaction));
      });

      // Real event: fraud alert received
      this.connection.on("FraudAlertReceived", (alert: AlertDto) => {
        this.alertCallbacks.forEach((cb) => cb(alert));
      });

      // Real event: dashboard refresh trigger
      this.connection.on("DashboardRefresh", () => {
        this.dashboardRefreshCallbacks.forEach((cb) => cb());
      });

      await this.connection.start();
      this.setStatus("Connected");

      // Join merchant-specific SignalR group
      const merchantId = this.getMerchantIdFromToken();
      console.log("Joining SignalR group for merchant:", merchantId);
      if (merchantId) {
        await this.connection.invoke("JoinMerchantGroup", merchantId);
      }
    } catch (error) {
      console.error("SignalR connection failed:", error);
      this.setStatus("Disconnected");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.setStatus("Disconnected");
    }
  }

  onTransactionProcessed(callback: TransactionCallback): () => void {
    this.transactionCallbacks.add(callback);
    return () => this.transactionCallbacks.delete(callback);
  }

  onAlertCreated(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  onDashboardRefresh(callback: DashboardRefreshCallback): () => void {
    this.dashboardRefreshCallbacks.add(callback);
    return () => this.dashboardRefreshCallbacks.delete(callback);
  }

  onConnectionStatusChanged(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === "Connected";
  }
}

// Singleton instance
export const signalRService = new SignalRService();
