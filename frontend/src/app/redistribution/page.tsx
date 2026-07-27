"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, CheckCircle2, XCircle, Truck, MapPin, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { CountUp } from "@/components/shared/CountUp";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useRedistributions } from "@/hooks/useRedistributions";

const COLUMNS = ["PENDING", "APPROVED", "COMPLETED"] as const;

function MissionCard({ item, onApprove, onDismiss }: {
  item: any;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
          <ArrowLeftRight size={18} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={12} />
            <span className="truncate">Transfer Mission</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{item.blood_group} • {item.units} units</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-[10px] text-slate-500">From</span>
        <span className="text-xs font-medium text-slate-700">Hospital {item.source_hospital_id.slice(0, 8)}...</span>
      </div>
      <div className="flex items-center justify-center py-1">
        <div className="h-4 w-px bg-slate-200" />
      </div>
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-[10px] text-slate-500">To</span>
        <span className="text-xs font-medium text-slate-700">Hospital {item.target_hospital_id.slice(0, 8)}...</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.ai_confidence && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            <Shield size={10} /> {(item.ai_confidence * 100).toFixed(0)}% conf
          </span>
        )}
        {item.distance_km && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            <MapPin size={10} /> {item.distance_km}km
          </span>
        )}
        {item.estimated_travel_time_mins && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            <Clock size={10} /> {item.estimated_travel_time_mins}min
          </span>
        )}
      </div>

      {item.status === "PENDING" && (
        <div className="mt-3 flex gap-2">
          <GradientButton
            onClick={() => { onApprove(); toast.success("Transfer approved"); }}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs"
          >
            <CheckCircle2 size={14} /> Approve
          </GradientButton>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { onDismiss(); toast.error("Transfer dismissed"); }}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <XCircle size={14} /> Dismiss
          </motion.button>
        </div>
      )}

      {item.status === "APPROVED" && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-2 text-xs font-medium text-amber-600">
          <Truck size={14} /> In Transit
        </div>
      )}

      {item.status === "COMPLETED" && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-xs font-medium text-emerald-600">
          <CheckCircle2 size={14} /> Completed
        </div>
      )}
    </motion.div>
  );
}

export default function RedistributionPage() {
  const { data: redistributions, loading, refetch } = useRedistributions();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visible = redistributions.filter((r) => !dismissedIds.has(r.id));

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col] = visible.filter((r) => r.status === col);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const columnLabels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "In Transit",
    COMPLETED: "Completed",
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={20} className="text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Redistribution</h1>
        </div>
        <p className="text-sm text-slate-500">AI-recommended blood unit transfers between hospitals</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5" delay={0}>
          <p className="text-2xl font-bold"><CountUp end={redistributions.length} /></p>
          <p className="text-xs text-slate-500">Total Transfers</p>
        </GlassCard>
        <GlassCard className="p-5" delay={0.06}>
          <p className="text-2xl font-bold"><CountUp end={redistributions.filter((r) => r.status === "PENDING").length} /></p>
          <p className="text-xs text-slate-500">Pending Approval</p>
        </GlassCard>
        <GlassCard className="p-5" delay={0.12}>
          <p className="text-2xl font-bold"><CountUp end={redistributions.filter((r) => r.status === "APPROVED").length} /></p>
          <p className="text-xs text-slate-500">In Transit</p>
        </GlassCard>
      </div>

      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">{columnLabels[col]}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {grouped[col]?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {(grouped[col] || []).map((item: any) => (
                    <MissionCard
                      key={item.id}
                      item={item}
                      onApprove={() => refetch()}
                      onDismiss={() => setDismissedIds((prev) => new Set(prev).add(item.id))}
                    />
                  ))}
                </AnimatePresence>
                {(!grouped[col] || grouped[col].length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
