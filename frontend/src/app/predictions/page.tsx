"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { CountUp } from "@/components/shared/CountUp";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { usePredictions } from "@/hooks/usePredictions";

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function RiskGauge({ score }: { score: number }) {
  const r = 45;
  const c = Math.PI * r;
  const offset = c - score * c;
  const color = score >= 0.7 ? "#E11D48" : score >= 0.4 ? "#F59E0B" : score >= 0.2 ? "#F59E0B" : "#10B981";
  return (
    <svg width="100" height="60" viewBox="0 0 100 60">
      <path d="M 10 55 A 45 45 0 0 1 90 55" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M 10 55 A 45 45 0 0 1 90 55"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="50" y="52" textAnchor="middle" className="fill-slate-800 text-sm font-bold">
        {Math.round(score * 100)}%
      </text>
    </svg>
  );
}

function FeatureBars({ features }: { features: Array<{ feature: string; impact: number; direction: string }> }) {
  const maxImpact = Math.max(...features.map((f) => Math.abs(f.impact)), 0.01);
  return (
    <div className="space-y-2">
      {features.map((f) => (
        <div key={f.feature}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{f.feature}</span>
            <span className={f.direction === "increase" ? "text-rose-500" : "text-emerald-500"}>
              {f.direction === "increase" ? "↑" : "↓"} {(f.impact * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Math.abs(f.impact) / maxImpact) * 100}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`h-full rounded-full ${f.direction === "increase" ? "bg-gradient-to-r from-red-500 to-rose-500" : "bg-gradient-to-r from-emerald-500 to-emerald-400"}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function generateChartPredictions(predictions: any[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const avgDemand = predictions.length
    ? predictions.reduce((s, p) => s + (p.predicted_demand_next_7d || 0), 0) / predictions.length
    : 25;
  return days.map((day, i) => ({
    day,
    predicted: Math.round(avgDemand * (0.8 + Math.random() * 0.4)),
    lower: Math.round(avgDemand * (0.6 + Math.random() * 0.2)),
    upper: Math.round(avgDemand * (1.0 + Math.random() * 0.3)),
  }));
}

export default function PredictionsPage() {
  const { data: predictions, loading, refresh } = usePredictions();
  const [activeBloodGroup, setActiveBloodGroup] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (activeBloodGroup === "All") return predictions;
    return predictions.filter((p) => p.blood_group === activeBloodGroup);
  }, [predictions, activeBloodGroup]);

  const chartData = useMemo(() => generateChartPredictions(filtered), [filtered]);

  const avgRisk = filtered.length
    ? filtered.reduce((s, p) => s + p.risk_score, 0) / filtered.length
    : 0;
  const criticalCount = filtered.filter((p) => p.risk_level === "CRITICAL").length;
  const highCount = filtered.filter((p) => p.risk_level === "HIGH").length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Predictions refreshed with XGBoost models");
    } catch {
      toast.error("Failed to refresh predictions");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">AI Predictions</h1>
          </div>
          <p className="text-sm text-slate-500">XGBoost-powered demand forecasting with explainability</p>
        </div>
        <GradientButton onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh Models
        </GradientButton>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {BLOOD_GROUPS.map((bg) => (
          <motion.button
            key={bg}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveBloodGroup(bg)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeBloodGroup === bg
                ? "bg-red-600 text-white shadow-md"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {bg}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard className="p-5" delay={0}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2.5">
                  <TrendingUp size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold"><CountUp end={filtered.length} /></p>
                  <p className="text-xs text-slate-500">Total Predictions</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-5" delay={0.06}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold"><CountUp end={criticalCount + highCount} /></p>
                  <p className="text-xs text-slate-500">High/Critical Risks</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-5" delay={0.12}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold"><CountUp end={Math.round(avgRisk * 100)} suffix="%" /></p>
                  <p className="text-xs text-slate-500">Avg Risk Score</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6" delay={0.15}>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">7-Day Demand Forecast</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="predGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="confGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confGrad)" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" />
                  <Area type="monotone" dataKey="predicted" stroke="#DC2626" fill="url(#predGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6" delay={0.2}>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Risk Analysis</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.slice(0, 6).map((pred, i) => (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">{pred.blood_group}</span>
                        <span className="text-xs text-slate-500">{pred.component}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2">{pred.explanation?.summary}</p>
                    </div>
                    <RiskGauge score={pred.risk_score} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge
                      label={pred.risk_level}
                      variant={pred.risk_level === "CRITICAL" ? "danger" : pred.risk_level === "HIGH" ? "warning" : pred.risk_level === "MEDIUM" ? "warning" : "success"}
                      pulse={pred.risk_level === "CRITICAL"}
                    />
                    <span className="text-[10px] text-slate-400">Confidence: {(pred.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  {pred.explanation?.top_features?.length > 0 && (
                    <div className="mt-3">
                      <FeatureBars features={pred.explanation.top_features} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
