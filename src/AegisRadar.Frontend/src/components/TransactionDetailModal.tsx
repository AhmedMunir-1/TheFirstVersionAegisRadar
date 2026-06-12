import React, { useState } from "react";
import { X, Check, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/services/apiClient";
import type { TransactionResponseDto } from "@/types/api";

interface TransactionDetailModalProps {
  transaction: TransactionResponseDto | null;
  onClose: () => void;
  onReviewComplete: (updated: TransactionResponseDto) => void;
  isLoading?: boolean;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onReviewComplete,
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const fraudProbability = transaction.prediction?.fraudProbability ?? 0;

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const updated = await apiClient.transactions.review(transaction.id, {
        decision: "approve",
        note: note || undefined,
      });
      onReviewComplete(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const updated = await apiClient.transactions.review(transaction.id, {
        decision: "block",
        note: note || undefined,
      });
      onReviewComplete(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to block transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canReview = transaction.status === "Review" || transaction.status === "Pending";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                transaction.status === "Approved"
                  ? "bg-green-500/20 text-green-400"
                  : transaction.status === "Blocked"
                    ? "bg-red-500/20 text-red-400"
                    : transaction.status === "Review"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {transaction.status}
            </span>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Amount</p>
              <p className="text-white text-lg font-semibold">
                {transaction.amount.toFixed(2)} {transaction.currency}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Fraud Probability / AI Decision</p>
              <div className="flex items-center gap-2 mt-1">
                <p
                  className={`text-lg font-semibold ${
                    fraudProbability < 0.3
                      ? "text-green-400"
                      : fraudProbability < 0.6
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {(fraudProbability * 100).toFixed(1)}%
                </p>
                {transaction.prediction?.decision && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full border font-medium ${
                      transaction.prediction.decision.toLowerCase() === "approve" || transaction.prediction.decision.toLowerCase() === "approved"
                        ? "bg-green-500/20 text-green-400 border-green-500/50"
                        : transaction.prediction.decision.toLowerCase() === "block" || transaction.prediction.decision.toLowerCase() === "blocked"
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                    }`}
                  >
                    AI: {transaction.prediction.decision.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer and MCC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Customer ID</p>
              <p className="text-white font-mono text-sm">{transaction.customerId}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">MCC</p>
              <p className="text-white text-sm">{transaction.mcc}</p>
            </div>
          </div>

          {/* Country and IP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Country</p>
              <p className="text-white text-sm">{transaction.transactionCountry ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">IP Address</p>
              <p className="text-white text-sm font-mono">{transaction.ipAddress ?? "—"}</p>
            </div>
          </div>

          {/* Device and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Device ID</p>
              <p className="text-white font-mono text-sm">{transaction.deviceId ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white text-sm">
                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Review Note */}
          {canReview && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">Admin Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                placeholder="Add a note about your decision..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                rows={3}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 border-t border-slate-700 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium transition-colors disabled:opacity-50"
          >
            Close
          </button>
          {canReview && (
            <>
              <button
                onClick={handleBlock}
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Block
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
