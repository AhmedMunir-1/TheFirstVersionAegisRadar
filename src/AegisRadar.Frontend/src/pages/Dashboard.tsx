import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useSignalR } from "@/hooks/useSignalR";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";

interface Stats {
  totalTransactionsToday: number;
  flaggedTransactions: number;
  blockedTransactions: number;
  accuracyRate: number;
}

interface Trend {
  date: string;
  totalCount: number;
  fraudCount: number;
}

interface Transaction {
  id: string;
  amount: number;
  riskScore: number;
  decision: string;
  createdAt: string;
}

interface Alert {
  id: string;
  message: string;
  severity: string;
  createdAt: string;
}

const Dashboard = () => {
  useSignalR(); // Initialize SignalR connection
  
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trialCountdown, setTrialCountdown] = useState<string>("");

  useEffect(() => {
    if (!user?.trialEndDate) {
      setTrialCountdown("");
      return;
    }

    const updateCountdown = () => {
      const end = new Date(user.trialEndDate).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setTrialCountdown("Trial expired");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTrialCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [user?.trialEndDate]);

  useEffect(() => {
    const loadData = async () => {
      const [statsRes, trendsRes, recentRes, alertsRes] = await Promise.all([
        fetchApi<Stats>("/api/dashboard/stats"),
        fetchApi<Trend[]>("/api/dashboard/trends?days=7"),
        fetchApi<Transaction[]>("/api/dashboard/recent?count=5"),
        fetchApi<Alert[]>("/api/alerts?unreadOnly=true")
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (trendsRes.success && trendsRes.data) setTrends(trendsRes.data);
      if (recentRes.success && Array.isArray(recentRes.data)) {
        const mapped = recentRes.data.map((tx: any) => ({
          id: tx.id,
          amount: tx.amount,
          riskScore: tx.prediction?.fraudProbability ?? (tx.status?.toLowerCase() === 'blocked' ? 0.95 : tx.status?.toLowerCase() === 'review' ? 0.5 : 0.05),
          decision: tx.prediction?.decision?.toLowerCase() ?? tx.status?.toLowerCase() ?? 'approved',
          createdAt: tx.createdAt
        }));
        setRecent(mapped);
      }
      if (alertsRes.success && alertsRes.data) setAlerts(alertsRes.data.slice(0, 5)); // Just show top 5 unread
    };

    loadData();
    
    // Poll every 15 seconds to keep dashboard fresh
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const trialActive = Boolean(user?.isTrialActive && user?.trialEndDate && new Date(user.trialEndDate) > new Date());

  return (
    <div className="space-y-6">
      {user?.trialEndDate && (
        <Card className={`bg-card-gradient border-border shadow-sm ${trialActive ? "border-green-400/30" : "border-red-400/30"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Trial</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">14-day trial ends on</div>
            <div className="text-3xl font-bold">{trialActive ? trialCountdown : "Expired"}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {trialActive
                ? `Ends ${new Date(user.trialEndDate).toLocaleDateString()}`
                : "Your trial has ended. Upgrade to keep using AegisRadar."}
            </p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card-gradient border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactionsToday || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card-gradient border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-500">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flaggedTransactions || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card-gradient border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Blocked</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blockedTransactions || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card-gradient border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-500">Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.accuracyRate || 99.7)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card-gradient border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Fraud Detection Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                        <Area type="monotone" dataKey="totalCount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                        <Area type="monotone" dataKey="fraudCount" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFraud)" name="Fraud" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-card-gradient border-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unread alerts.</p>
              ) : (
                  alerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg bg-background/50 border border-border">
                          <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.severity === 'High' ? 'text-red-500' : 'text-yellow-500'}`} />
                          <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                          </div>
                      </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-card-gradient border-border shadow-sm">
        <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border border-border">
                <div className="grid grid-cols-5 bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
                    <div>ID</div>
                    <div>Amount</div>
                    <div>Risk Score</div>
                    <div>Decision</div>
                    <div>Time</div>
                </div>
                <div className="divide-y divide-border">
                    {recent.map(tx => (
                        <div key={tx.id} className="grid grid-cols-5 p-3 text-sm items-center hover:bg-muted/20 transition-colors">
                            <div className="font-mono text-muted-foreground truncate pr-2">{tx.id.split('-')[0]}</div>
                            <div className="font-medium">{tx.amount.toFixed(2)}</div>
                            <div>{(tx.riskScore * 100).toFixed(1)}%</div>
                            <div>
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                    tx.decision === 'approved' ? 'bg-green-500/10 text-green-400' :
                                    tx.decision === 'review' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-red-500/10 text-red-400'
                                }`}>
                                    {tx.decision}
                                </span>
                            </div>
                            <div className="text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                        </div>
                    ))}
                    {recent.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">No recent transactions.</div>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
