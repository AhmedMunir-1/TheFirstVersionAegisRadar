import * as signalR from "@microsoft/signalr";
import type {
  TransactionResponseDto,
  AlertDto,
  FraudDetectedEvent,
  TransactionResolvedEvent,
} from "@/types/api";

export type ConnectionStatus = "Connecting" | "Connected" | "Disconnected" | "Reconnecting";

type TransactionCallback = (transaction: TransactionResponseDto) => void;
type AlertCallback = (alert: AlertDto) => void;
type FraudDetectedCallback = (data: FraudDetectedEvent) => void;
type TransactionResolvedCallback = (data: TransactionResolvedEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private connectionStatus: ConnectionStatus = "Disconnected";
  private statusCallbacks: Set<StatusCallback> = new Set();
  private transactionCallbacks: Set<TransactionCallback> = new Set();
  private fraudDetectedCallbacks: Set<FraudDetectedCallback> = new Set();
  private alertCallbacks: Set<AlertCallback> = new Set();
  private transactionResolvedCallbacks: Set<TransactionResolvedCallback> = new Set();

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

      const signalRUrl = import.meta.env.VITE_SIGNALR_URL || "http://localhost:5099/hubs/fraud";

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRUrl, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
        .withServerTimeout(30000)
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.onreconnecting(() => {
        this.setStatus("Reconnecting");
      });

      this.connection.onreconnected(() => {
        this.setStatus("Connected");
      });

      this.connection.onclose(() => {
        this.setStatus("Disconnected");
      });

      this.connection.on("TransactionProcessed", (transaction: TransactionResponseDto) => {
        this.transactionCallbacks.forEach((cb) => cb(transaction));
      });

      // Also listen to backend's TransactionUpdated event (from PredictionConsumerService)
      this.connection.on("TransactionUpdated", (transaction: TransactionResponseDto) => {
        this.transactionCallbacks.forEach((cb) => cb(transaction));
      });

      this.connection.on("FraudDetected", (data: FraudDetectedEvent) => {
        this.fraudDetectedCallbacks.forEach((cb) => cb(data));
      });

      this.connection.on("AlertCreated", (alert: AlertDto) => {
        this.alertCallbacks.forEach((cb) => cb(alert));
      });

      // Also listen to backend's FraudAlertReceived event
      this.connection.on("FraudAlertReceived", (alert: AlertDto) => {
        this.alertCallbacks.forEach((cb) => cb(alert));
      });

      this.connection.on("TransactionResolved", (data: TransactionResolvedEvent) => {
        this.transactionResolvedCallbacks.forEach((cb) => cb(data));
      });

      await this.connection.start();
      this.setStatus("Connected");
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

  onFraudDetected(callback: FraudDetectedCallback): () => void {
    this.fraudDetectedCallbacks.add(callback);
    return () => this.fraudDetectedCallbacks.delete(callback);
  }

  onAlertCreated(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  onTransactionResolved(callback: TransactionResolvedCallback): () => void {
    this.transactionResolvedCallbacks.add(callback);
    return () => this.transactionResolvedCallbacks.delete(callback);
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

