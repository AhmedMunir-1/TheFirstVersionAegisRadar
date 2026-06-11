import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { Server, Zap, Shield, TrendingUp } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { DemoStatusDto, BatchTestResponseDto } from "@/types/api";
import { toast } from "sonner";

interface DemoTransaction {
  transactionId: string;
  merchant: string;
  amount: number;
  timestamp: string;
  velocity1h: number;
  velocity24h: number;
  merchantCategory: string;
}

export default function Demo() {
  const [status, setStatus] = useState<DemoStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchCount, setBatchCount] = useState("30");
  const [batchType, setBatchType] = useState("mixed");
  const [batchTransactions, setBatchTransactions] = useState<DemoTransaction[]>([]);

  // Load demo status on mount
  useEffect(() => {
    loadDemoStatus();
  }, []);

  const loadDemoStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient.demo.getStatus();
      setStatus(data);
    } catch (error) {
      toast.error("Failed to load demo status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchTest = async () => {
    try {
      setBatchLoading(true);
      const count = Math.min(parseInt(batchCount) || 30, 100);
      const data = await apiClient.demo.batchTest(count, batchType === "mixed" ? undefined : batchType);
      setBatchTransactions(data.transactions);
      toast.success(`Generated ${data.transactions.length} test transactions`);
    } catch (error) {
      toast.error("Failed to generate batch transactions");
      console.error(error);
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AegisRadar Demo</h1>
          <p className="text-slate-400">Explore fraud detection capabilities without authentication</p>
        </div>

        {/* Status Dashboard */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{status.status}</div>
                <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                  {status.modelVersion}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Model Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{status.accuracy}%</div>
                <p className="text-xs text-slate-400 mt-2">Detection Rate</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  Transactions Analyzed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{status.totalTransactions.toLocaleString()}</div>
                <p className="text-xs text-slate-400 mt-2">All Time</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{status.avgResponseMs}ms</div>
                <p className="text-xs text-slate-400 mt-2">Average Latency</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Batch Test Section */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle>Batch Test Generator</CardTitle>
            <CardDescription>Generate sample transactions for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Number of Transactions
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={batchCount}
                    onChange={(e) => setBatchCount(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Transaction Type
                  </label>
                  <Select value={batchType} onValueChange={setBatchType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="mixed">Mixed (all types)</SelectItem>
                      <SelectItem value="normal">Normal (low risk)</SelectItem>
                      <SelectItem value="highrisk">High Risk (suspicious)</SelectItem>
                      <SelectItem value="electronics">Electronics (moderate risk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleBatchTest}
                    disabled={batchLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {batchLoading ? "Generating..." : "Generate Test Data"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Transactions Table */}
        {batchTransactions.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Generated Transactions ({batchTransactions.length})</CardTitle>
              <CardDescription>Sample data for testing fraud detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">1H Velocity</th>
                      <th className="px-4 py-3">24H Velocity</th>
                      <th className="px-4 py-3">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchTransactions.slice(0, 20).map((tx) => (
                      <tr key={tx.transactionId} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="px-4 py-3 font-mono text-xs">{tx.transactionId.substring(0, 8)}...</td>
                        <td className="px-4 py-3">{tx.merchant}</td>
                        <td className="px-4 py-3">${tx.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">{tx.velocity1h}</td>
                        <td className="px-4 py-3">{tx.velocity24h}</td>
                        <td className="px-4 py-3">{tx.merchantCategory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batchTransactions.length > 20 && (
                  <p className="text-center text-slate-400 text-sm mt-4">
                    Showing 20 of {batchTransactions.length} transactions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
