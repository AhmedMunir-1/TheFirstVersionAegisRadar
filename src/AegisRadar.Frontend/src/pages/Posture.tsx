import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { AlertTriangle, Check, TrendingUp, Shield } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { PostureSummaryDto } from "@/types/api";
import { toast } from "sonner";

interface ScoreCard {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export default function Posture() {
  const [data, setData] = useState<PostureSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosture();
  }, []);

  const loadPosture = async () => {
    try {
      setLoading(true);
      const result = await apiClient.posture.getSummary();
      setData(result);
    } catch (error) {
      toast.error("Failed to load security posture");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No posture data available</p>
      </div>
    );
  }

  const scoreCards: ScoreCard[] = [
    {
      label: "Fraud Prevention",
      value: data.fraudPrevention,
      icon: <Shield className="w-4 h-4 text-blue-500" />,
    },
    {
      label: "Auth Strength",
      value: data.authStrength,
      icon: <Check className="w-4 h-4 text-green-500" />,
    },
    {
      label: "Model Accuracy",
      value: data.modelAccuracy,
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
    },
    {
      label: "Response Coverage",
      value: data.responseCoverage,
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const radarData = [
    { category: "Fraud Prevention", value: data.fraudPrevention },
    { category: "Auth Strength", value: data.authStrength },
    { category: "Model Accuracy", value: data.modelAccuracy },
    { category: "Response Coverage", value: data.responseCoverage },
    { category: "Policy Compliance", value: data.policyCompliance },
  ];

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Security Posture</h1>
          <p className="text-slate-400">Comprehensive security assessment and risk evaluation</p>
        </div>

        {/* Overall Score */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader className="pb-4">
            <CardTitle>Overall Security Score</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="4"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeDasharray={`${(data.overallScore / 100) * 376.99} 376.99`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
                    {data.overallScore}
                  </div>
                  <div className="text-xs text-slate-400">/100</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-slate-300 mb-4">
                Your organization demonstrates a{" "}
                <span className="font-semibold">
                  {data.overallScore >= 80
                    ? "strong"
                    : data.overallScore >= 60
                    ? "moderate"
                    : "weak"}{" "}
                </span>
                security posture with{" "}
                <span className="font-semibold">
                  {data.overallScore >= 80
                    ? "excellent"
                    : data.overallScore >= 60
                    ? "good"
                    : "needs improvement"}
                </span>{" "}
                fraud prevention capabilities.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Last Scan</p>
                  <p className="text-white font-semibold">{data.lastScan}</p>
                </div>
                <div>
                  <p className="text-slate-400">Report Period</p>
                  <p className="text-white font-semibold">{data.reportPeriod}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {scoreCards.map((card, idx) => (
            <Card key={idx} className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  {card.icon}
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(card.value)}`}>
                  {card.value}
                </div>
                <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      card.value >= 80
                        ? "bg-green-500"
                        : card.value >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${card.value}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Radar Chart */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#94a3b8" domain={[0, 100]} />
                <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threats Table */}
        {data.threats && data.threats.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle>Top Threats</CardTitle>
              <CardDescription>Identified security risks by probability</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Threat</th>
                    <th className="px-4 py-3">Count</th>
                    <th className="px-4 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.threats.slice(0, 5).map((threat, idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="px-4 py-3">{threat.name}</td>
                      <td className="px-4 py-3">{threat.count}</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          threat.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          threat.severity === 'HIGH' ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                          "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }>
                          {threat.severity}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actions to improve security posture</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.recommendations.slice(0, 5).map((rec, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-200 font-medium">{rec.title}</span>
                      <p className="text-slate-400 mt-1">{rec.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
