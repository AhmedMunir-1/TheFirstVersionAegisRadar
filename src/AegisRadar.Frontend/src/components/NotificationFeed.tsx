import React, { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { AppNotificationDto } from "@/types/api";
import { formatDistanceToNow } from "date-fns";

interface NotificationFeedProps {
  merchantId?: string;
}

export default function NotificationFeed({ merchantId }: NotificationFeedProps) {
  const [notifications, setNotifications] = useState<AppNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.inAppNotifications.getNotifications();
      const unreadData = data.filter((n) => !n.isRead);
      setNotifications(unreadData);
      setUnreadCount(unreadData.length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications on mount and set up polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.inAppNotifications.markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string, severity: string) => {
    if (type === "fraud_alert") {
      if (severity === "critical" || severity === "high") {
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      }
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    if (type === "system") {
      return <Info className="w-5 h-5 text-blue-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-300 hover:text-white"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-96 bg-slate-800 border-slate-700" side="right">
        <SheetHeader>
          <SheetTitle className="text-white">Notifications</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.isRead
                    ? "bg-slate-900/30 border-slate-700"
                    : "bg-slate-900/50 border-slate-600"
                } cursor-pointer hover:bg-slate-900/70 transition-colors`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={getSeverityColor(notification.severity)}>
                        {notification.severity}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-800">
          <Button
            onClick={loadNotifications}
            disabled={loading}
            variant="outline"
            className="w-full border-slate-600"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
