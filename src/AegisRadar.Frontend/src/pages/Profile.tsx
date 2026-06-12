import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Key, User, Building, MapPin, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard");
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Merchant Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your account settings and API keys.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card-gradient border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Building className="w-4 h-4" /> Company Name
              </Label>
              <div className="font-medium">{user.companyName}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </Label>
              <div className="font-medium">{user.email}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Country
              </Label>
              <div className="font-medium">{user.country}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-gradient border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription & Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Current Plan</Label>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {user.plan}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Account Role</Label>
              <div className="font-medium capitalize">{user.role.toLowerCase()}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Member Since</Label>
              <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
            {/* Trial Status — always visible */}
            {(() => {
              const start = user.trialStartDate
                ? new Date(user.trialStartDate)
                : new Date(user.createdAt);
              const end = user.trialEndDate
                ? new Date(user.trialEndDate)
                : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

              const now = new Date();
              const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const totalDays = 14;
              const usedDays = Math.min(totalDays, totalDays - diffDays);
              const progressPct = Math.min(100, Math.max(0, (usedDays / totalDays) * 100));
              const trialEnd = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

              if (diffDays > 0) {
                return (
                  <div className="pt-2 space-y-3">
                    {/* Active trial countdown */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-blue-400">🎁 14-Day Free Trial</div>
                        <div className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                          {diffDays} {diffDays === 1 ? 'day' : 'days'} left
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-xs text-blue-300/70">
                        Trial ends on <span className="font-medium text-blue-300">{trialEnd}</span>.
                      </div>
                    </div>
                    {/* Subscribe button — always shown */}
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 font-semibold"
                      onClick={() => navigate("/dashboard/subscription")}
                    >
                      ⚡ Choose a Subscription Plan
                    </Button>
                  </div>
                );
              } else {
                return (
                  <div className="pt-2 space-y-3">
                    {/* Expired notice */}
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <div className="text-sm font-semibold text-red-400">Trial Expired</div>
                      </div>
                      <p className="text-xs text-red-300/80">
                        Your free trial ended on <span className="font-medium text-red-300">{trialEnd}</span>.
                        Subscribe to continue using AegisRadar.
                      </p>
                    </div>
                    {/* Subscribe button */}
                    <Button
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white border-0 font-semibold"
                      onClick={() => navigate("/dashboard/subscription")}
                    >
                      💳 Subscribe Now — Monthly Plan
                    </Button>
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card-gradient border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              API Integration
            </CardTitle>
            <CardDescription>
              Use this key to authenticate your backend requests to the AegisRadar API. Keep it secret.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end max-w-xl">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="apiKey">Your Secret API Key</Label>
                <Input 
                  id="apiKey" 
                  value={user.apiKey} 
                  readOnly 
                  className="font-mono bg-muted/50"
                  type="password"
                />
              </div>
              <Button 
                variant="outline" 
                className="shrink-0"
                onClick={() => copyToClipboard(user.apiKey)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-semibold text-primary mb-2">Integration Example (cURL)</h4>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`curl -X POST https://api.aegisradar.io/v1/predict \\
  -H "Authorization: Bearer ${user.apiKey.substring(0, 8)}..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2500.50,
    "user_degree": 2,
    "merchant_degree": 1,
    "mcc": 5411,
    "is_foreign": 0,
    "hour": 14
}'`}
                </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
