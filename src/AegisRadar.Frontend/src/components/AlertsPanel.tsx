import React, { useState, useMemo, useEffect, useRef } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { AlertDto } from "@/types/api";

interface AlertsPanelProps {
  alerts: AlertDto[];
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  isLoading?: boolean;
}

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "Critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "High":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "Medium":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "Low":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAlertClick = (alertId: string) => {
    onMarkAsRead(alertId);
    setIsOpen(false);
    navigate("/dashboard/alerts");
  };

  const displayAlerts = alerts; // Show all recent alerts in the dropdown

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors focus:outline-none"
        aria-label="Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 shadow-xl rounded-lg overflow-hidden z-50">
          {/* Header */}
          <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <div>
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllAsRead();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Alerts List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : displayAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No new alerts</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-800/50">
                {displayAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => handleAlertClick(alert.id)}
                    className={`w-full text-left p-4 hover:bg-slate-800/50 transition-colors ${
                      !alert.isRead ? "bg-slate-800/20" : "opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-full border ${getSeverityStyles(alert.severity)}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-white">
                            {alert.severity} Alert
                          </span>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 ${!alert.isRead ? "text-gray-300 font-medium" : "text-gray-400"}`}>
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 border-t border-slate-700 p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/dashboard/alerts");
              }}
              className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-2 rounded transition-colors"
            >
              View all alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
