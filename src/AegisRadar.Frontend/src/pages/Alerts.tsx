import { useEffect, useState, useCallback } from "react";
import { useAlertStore } from "@/store/alertStore";
import { apiClient } from "@/services/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { TransactionResponseDto, AlertDto } from "@/types/api";

const getSeverityClasses = (severity: string) => {
  switch (severity) {
    case "Critical":
      return {
        icon: "bg-red-500/20 text-red-500",
        badge: "bg-red-500/10 text-red-500 animate-pulse",
      };
    case "High":
      return {
        icon: "bg-orange-500/20 text-orange-500",
        badge: "bg-orange-500/10 text-orange-500",
      };
    case "Medium":
      return {
        icon: "bg-yellow-500/20 text-yellow-500",
        badge: "bg-yellow-500/10 text-yellow-500",
      };
    default:
      return {
        icon: "bg-blue-500/20 text-blue-500",
        badge: "bg-blue-500/10 text-blue-500",
      };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved": return "text-green-400";
    case "Blocked":  return "text-red-400";
    case "Review":   return "text-yellow-400";
    default:         return "text-gray-400";
  }
};

interface AlertRowProps {
  alert: AlertDto;
  onMarkRead: (id: string) => void;
  onDecision: (alertId: string, transactionId: string, decision: "Approved" | "Blocked") => Promise<void>;
}

const AlertRow: React.FC<AlertRowProps> = ({ alert, onMarkRead, onDecision }) => {
  const [expanded, setExpanded] = useState(false);
  const [txDetails, setTxDetails] = useState<TransactionResponseDto | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [deciding, setDeciding] = useState<"Approved" | "Blocked" | null>(null);

  const severityClasses = getSeverityClasses(alert.severity);

  const handleExpand = useCallback(async () => {
    if (!alert.transactionId) return;
    setExpanded((prev) => !prev);
    if (!txDetails && !txLoading) {
      setTxLoading(true);
      try {
        const tx = await apiClient.transactions.getById(alert.transactionId);
        setTxDetails(tx);
      } catch {
        toast.error("Failed to load transaction details");
      } finally {
        setTxLoading(false);
      }
    }
  }, [alert.transactionId, txDetails, txLoading]);

  const handleDecision = async (decision: "Approved" | "Blocked") => {
    const label = decision === "Approved" ? "Approve" : "Block";
    const confirmed = window.confirm(`Are you sure you want to ${label} this transaction?`);
    if (!confirmed) return;

    setDeciding(decision);
    try {
      await onDecision(alert.id, alert.transactionId, decision);
      // Refresh tx details inline
      const updated = await apiClient.transactions.getById(alert.transactionId);
      setTxDetails(updated);
    } finally {
      setDeciding(null);
    }
  };

  const canDecide = !txDetails
    ? true // allow before loading — server will validate
    : txDetails.status !== "Approved" && txDetails.status !== "Blocked";

  return (
    <div
      className={`transition-colors ${!alert.isRead ? "bg-primary/5" : ""}`}
    >
      {/* Alert Header Row */}
      <div className="flex items-start justify-between p-4 hover:bg-muted/30">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${severityClasses.icon}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${!alert.isRead ? "text-foreground" : "text-muted-foreground"}`}>
              {alert.message}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityClasses.badge}`}>
                {alert.severity}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
              </span>
              {alert.transactionId && (
                <button
                  onClick={handleExpand}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expanded ? "Hide details" : "View transaction"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {alert.transactionId && canDecide && (
            <>
              <button
                disabled={deciding !== null}
                onClick={() => handleDecision("Approved")}
                className="px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30 rounded transition-colors disabled:opacity-50"
              >
                {deciding === "Approved" ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "✓ Approve"}
              </button>
              <button
                disabled={deciding !== null}
                onClick={() => handleDecision("Blocked")}
                className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded transition-colors disabled:opacity-50"
              >
                {deciding === "Blocked" ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "✗ Block"}
              </button>
            </>
          )}
          {!alert.isRead && (
            <Button variant="ghost" size="sm" onClick={() => onMarkRead(alert.id)}>
              Mark as read
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Transaction Details */}
      {expanded && alert.transactionId && (
        <div className="mx-4 mb-4 p-4 bg-slate-900/60 border border-slate-700 rounded-lg">
          {txLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading transaction details...
            </div>
          ) : txDetails ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                <p className="font-semibold text-white">
                  {txDetails.amount.toFixed(2)} {txDetails.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Country</p>
                <p className="font-semibold text-white">{txDetails.transactionCountry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <p className={`font-semibold ${getStatusColor(txDetails.status)}`}>
                  {txDetails.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fraud Probability</p>
                <p className="font-semibold text-white">
                  {txDetails.prediction
                    ? `${(txDetails.prediction.fraudProbability * 100).toFixed(1)}%`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                <p className="font-semibold text-white font-mono">
                  {txDetails.customerId.slice(0, 12)}...
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transaction ID</p>
                <p className="font-semibold text-gray-300 font-mono text-xs">
                  {txDetails.id.slice(0, 16)}...
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Could not load transaction details.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Alerts = () => {
  const alerts = useAlertStore((s) => s.alerts);
  const isLoading = useAlertStore((s) => s.isLoading);
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const loadAlerts = useAlertStore((s) => s.loadAlerts);
  const markRead = useAlertStore((s) => s.markRead);
  const markAllRead = useAlertStore((s) => s.markAllRead);

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
    } catch {
      toast.error("Failed to mark alert as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success("All alerts marked as read");
    } catch {
      toast.error("Failed to mark all alerts as read");
    }
  };

  const handleDecision = async (
    alertId: string,
    transactionId: string,
    decision: "Approved" | "Blocked"
  ) => {
    try {
      await apiClient.transactions.manualDecision(
        transactionId,
        decision,
        "Manual decision from alert"
      );
      toast.success(`Transaction ${decision} successfully`);
      await markRead(alertId);
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${decision === "Approved" ? "approve" : "block"} transaction`);
      throw err; // re-throw so AlertRow can handle it
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Fraud Alerts</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button onClick={handleMarkAllRead} variant="outline" size="sm">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Card className="bg-card-gradient border-border">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No alerts found.
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onMarkRead={handleMarkRead}
                  onDecision={handleDecision}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
