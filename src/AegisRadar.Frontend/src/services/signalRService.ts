import * as signalR from "@microsoft/signalr";

export type ConnectionStatus = "Connecting" | "Connected" | "Disconnected" | "Reconnecting";

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "Approved" | "Blocked" | "Review" | "Pending";
  fraudProbability: number;
  merchantName: string;
  country: string;
  createdAt: string;
  processingTimeMs: number;
}

export interface Prediction {
  transactionId: string;
  fraudProbability: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  completedAt: string;
}

export interface Alert {
  id: string;
  type: "Fraud" | "Anomaly" | "Threshold" | "Manual";
  severity: "Low" | "Medium" | "High" | "Critical";
  title: string;
  description: string;
  transactionId: string;
  createdAt: string;
  isRead: boolean;
}

export interface TransactionResolved {
  transactionId: string;
  finalStatus: "Approved" | "Blocked";
  resolvedAt: string;
}

type TransactionCallback = (transaction: Transaction) => void;
type PredictionCallback = (prediction: Prediction) => void;
type AlertCallback = (alert: Alert) => void;
type ResolvedCallback = (resolved: TransactionResolved) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private connectionStatus: ConnectionStatus = "Disconnected";
  private statusCallbacks: Set<StatusCallback> = new Set();
  private transactionCallbacks: Set<TransactionCallback> = new Set();
  private predictionCallbacks: Set<PredictionCallback> = new Set();
  private alertCallbacks: Set<AlertCallback> = new Set();
  private resolvedCallbacks: Set<ResolvedCallback> = new Set();

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      this.setStatus("Connecting");

      const token = localStorage.getItem("authToken");
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

      // Register event listeners
      this.connection.on("TransactionReceived", (transaction: Transaction) => {
        this.transactionCallbacks.forEach((cb) => cb(transaction));
      });

      this.connection.on("PredictionCompleted", (prediction: Prediction) => {
        this.predictionCallbacks.forEach((cb) => cb(prediction));
      });

      this.connection.on("AlertCreated", (alert: Alert) => {
        this.alertCallbacks.forEach((cb) => cb(alert));
      });

      this.connection.on("TransactionResolved", (resolved: TransactionResolved) => {
        this.resolvedCallbacks.forEach((cb) => cb(resolved));
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

  onTransactionReceived(callback: TransactionCallback): () => void {
    this.transactionCallbacks.add(callback);
    return () => this.transactionCallbacks.delete(callback);
  }

  onPredictionCompleted(callback: PredictionCallback): () => void {
    this.predictionCallbacks.add(callback);
    return () => this.predictionCallbacks.delete(callback);
  }

  onAlertCreated(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  onTransactionResolved(callback: ResolvedCallback): () => void {
    this.resolvedCallbacks.add(callback);
    return () => this.resolvedCallbacks.delete(callback);
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
