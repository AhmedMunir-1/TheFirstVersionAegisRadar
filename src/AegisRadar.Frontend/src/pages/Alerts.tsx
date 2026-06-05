import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    setIsLoading(true);
    const res = await fetchApi<Alert[]>("/api/alerts");
    if (res.success && res.data) {
      setAlerts(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const markAsRead = async (id: string) => {
    const res = await fetchApi(`/api/alerts/${id}/read`, { method: "PUT" });
    if (res.success) {
      setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
    } else {
      toast.error("Failed to mark alert as read");
    }
  };

  const markAllAsRead = async () => {
    const res = await fetchApi("/api/alerts/read-all", { method: "PUT" });
    if (res.success) {
      setAlerts(alerts.map(a => ({ ...a, isRead: true })));
      toast.success("All alerts marked as read");
    } else {
      toast.error("Failed to mark all alerts as read");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Fraud Alerts</h2>
        <Button onClick={markAllAsRead} variant="outline" size="sm">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Card className="bg-card-gradient border-border">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No alerts found.</div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`flex items-start justify-between p-4 transition-colors hover:bg-muted/30 ${!alert.isRead ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-full ${alert.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${!alert.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.severity === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(alert.id)}>
                      Mark as read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
