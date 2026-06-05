import { TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const mockStats = [
  { label: "Transactions Today", value: "1,247", change: "+12%", positive: true },
  { label: "Flagged", value: "23", change: "-8%", positive: true },
  { label: "Blocked", value: "7", change: "-15%", positive: true },
  { label: "Accuracy", value: "99.7%", change: "+0.2%", positive: true },
];

const mockTransactions = [
  { id: "TXN-001", amount: "2,450 EGP", risk: "Low", status: "approved", time: "2 min ago" },
  { id: "TXN-002", amount: "15,800 EGP", risk: "High", status: "blocked", time: "5 min ago" },
  { id: "TXN-003", amount: "890 EGP", risk: "Low", status: "approved", time: "8 min ago" },
  { id: "TXN-004", amount: "6,200 EGP", risk: "Medium", status: "review", time: "12 min ago" },
];

const chartHeights = [40, 25, 60, 35, 80, 45, 70, 30, 55, 40, 65, 50];

const DashboardPreview = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const isChartInView = useInView(chartRef, { once: true, margin: "-50px" });

  return (
    <section id="dashboard" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-glow opacity-30" />

      <div className="container relative z-10 px-6">
        {/* Section Header */}
        <ScrollReveal variant="fadeUp" className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Powerful <span className="text-gradient">Dashboard</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Monitor your transactions, analyze patterns, and take action—all in one place.
          </p>
        </ScrollReveal>

        {/* Dashboard Mock */}
        <ScrollReveal variant="scaleUp" delay={0.2}>
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl bg-card-gradient border border-border p-6 shadow-elevated">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Fraud Detection Overview</h3>
                  <p className="text-sm text-muted-foreground">Real-time monitoring dashboard</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {mockStats.map((stat, index) => (
                  <ScrollReveal key={stat.label} variant="fadeUp" delay={0.3 + index * 0.1}>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                        <span className={`text-xs font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              {/* Transactions Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-secondary/30 px-4 py-3 border-b border-border">
                  <h4 className="text-sm font-medium text-foreground">Recent Transactions</h4>
                </div>
                <div className="divide-y divide-border">
                  {mockTransactions.map((tx) => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-muted-foreground">{tx.id}</span>
                        <span className="text-sm font-semibold text-foreground">{tx.amount}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tx.risk === 'Low' ? 'bg-green-500/10 text-green-400' :
                          tx.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {tx.risk} Risk
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tx.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {tx.status === 'blocked' && <XCircle className="w-4 h-4 text-red-400" />}
                          {tx.status === 'review' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                          <span className="text-xs text-muted-foreground capitalize">{tx.status}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{tx.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="mt-6 p-6 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">Fraud Detection Trend</h4>
                </div>
                <div ref={chartRef} className="h-32 flex items-end justify-between gap-2">
                  {chartHeights.map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary/80 to-primary/20 rounded-t transition-all duration-300 hover:from-primary hover:to-primary/40"
                      initial={{ height: 0 }}
                      animate={isChartInView ? { height: `${height}%` } : { height: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.05,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Jan</span>
                  <span className="text-xs text-muted-foreground">Dec</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default DashboardPreview;
