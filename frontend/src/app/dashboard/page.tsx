"use client";
import { Droplets, AlertTriangle, Clock, Siren } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RegionalGrid } from "@/components/dashboard/RegionalGrid";
import { InventoryMatrix } from "@/components/dashboard/InventoryMatrix";
import { EmergencyFAB } from "@/components/dashboard/EmergencyFAB";
import { motion } from "framer-motion";

const stockTrend = [45, 52, 48, 61, 55, 72, 80];
const shortageTrend = [8, 6, 9, 5, 7, 4, 6];
const expiryTrend = [12, 15, 10, 18, 14, 22, 16];
const emergencyTrend = [1, 3, 2, 1, 4, 2, 2];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-red-500">
            BloodBridge AI
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Regional Command Center</h1>
        </div>
        <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald">
          ● Live Network
        </span>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Stock Units" value={1248} icon={Droplets} color="#10B981" trend={stockTrend} delay={0} />
        <KpiCard label="Impending Shortages" value={6} icon={AlertTriangle} color="#DC2626" trend={shortageTrend} delay={0.06} />
        <KpiCard label="Units Near Expiry" value={42} icon={Clock} color="#F59E0B" trend={expiryTrend} delay={0.12} />
        <KpiCard label="Active Emergencies" value={2} icon={Siren} color="#E11D48" trend={emergencyTrend} delay={0.18} />
      </section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Regional Overview</h2>
        <RegionalGrid />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <InventoryMatrix />
      </motion.div>

      <EmergencyFAB />
    </div>
  );
}
