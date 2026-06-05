import React, { useState, useMemo, useEffect } from "react";
import { Bell, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { Alert } from "@/services/signalRService";

interface AlertsPanelProps {
  alerts: Alert[];
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  isLoading?: boolean;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "Critical":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    case "High":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "Medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "Low":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
};

const getCriticalPulse = (severity: string) => {
  return severity === "Critical" ? "animate-pulse shadow-lg shadow-red-500/20" : "";
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);
  const criticalAlerts = useMemo(
    () => alerts.filter((a) => a.severity === "Critical" && !a.isRead).length,
    [alerts]
  );

  // Play sound for new critical alerts
  useEffect(() => {
    if (soundEnabled && criticalAlerts > 0) {
      // Simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, [criticalAlerts, soundEnabled]);

  return (
    <div className="fixed right-0 top-0 h-screen z-50">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-14 top-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-lg transition-all relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center -translate-y-1 translate-x-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="w-96 h-screen bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-white">Alerts</h2>
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-3 flex items-center gap-2 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span>Sound alerts</span>
            </label>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-3 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Loading alerts...</p>
                </div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No alerts yet
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded border transition-all ${getSeverityColor(
                      alert.severity
                    )} ${getCriticalPulse(alert.severity)} ${
                      alert.isRead ? "opacity-60" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{alert.title}</h4>
                        <p className="text-xs opacity-90 line-clamp-2">{alert.description}</p>
                      </div>
                      <button
                        onClick={() => onMarkAsRead(alert.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                      >
                        {alert.isRead ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-75">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-black/30 text-gray-300">
                        {alert.type}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-2 text-xs text-gray-500 flex-shrink-0">
            Total: {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};
