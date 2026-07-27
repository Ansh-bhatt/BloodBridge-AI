"use client";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["RBC", "Platelets", "Plasma", "Cryoprecipitate", "Whole Blood"];

function getStatus(units: number): { color: string; bg: string } {
  if (units < 5) return { color: "bg-rose-500", bg: "bg-rose-50" };
  if (units < 20) return { color: "bg-amber-500", bg: "bg-amber-50" };
  return { color: "bg-emerald-500", bg: "bg-emerald-50" };
}

interface MatrixCell {
  bg: string;
  component: string;
  units: number;
}

export function InventoryMatrix() {
  const [mounted, setMounted] = useState(false);
  const [matrix, setMatrix] = useState<MatrixCell[][]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ bg: string; component: string } | null>(null);

  // Generate random data ONLY on client after hydration
  useEffect(() => {
    const data = BLOOD_GROUPS.map((bg) =>
      COMPONENTS.map((comp) => ({
        bg,
        component: comp,
        units: Math.floor(Math.random() * 50),
      }))
    );
    setMatrix(data);
    setMounted(true);
  }, []);

  // Skeleton while SSR or loading
  if (!mounted || matrix.length === 0) {
    return (
      <GlassCard className="p-6" delay={0.2}>
        <h2 className="text-lg font-semibold text-slate-800">Inventory Matrix</h2>
        <p className="text-xs text-slate-500">Blood groups × Components • Click for details</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-medium text-slate-500">BG \ Comp</th>
                {COMPONENTS.map((c) => (
                  <th key={c} className="px-2 py-1 text-center font-medium text-slate-500">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((bg) => (
                <tr key={bg}>
                  <td className="px-2 py-1.5 font-semibold text-slate-700">{bg}</td>
                  {COMPONENTS.map((c) => (
                    <td key={c} className="px-2 py-1.5 text-center">
                      <Skeleton className="mx-auto h-6 w-6 rounded-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6" delay={0.2}>
      <h2 className="text-lg font-semibold text-slate-800">Inventory Matrix</h2>
      <p className="text-xs text-slate-500">Blood groups × Components • Click for details</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-slate-500">BG \ Comp</th>
              {COMPONENTS.map((c) => (
                <th key={c} className="px-2 py-1 text-center font-medium text-slate-500">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row[0].bg}>
                <td className="px-2 py-1.5 font-semibold text-slate-700">{row[0].bg}</td>
                {row.map((cell) => {
                  const { color } = getStatus(cell.units);
                  return (
                    <td key={cell.component} className="px-2 py-1.5 text-center">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedCell({ bg: cell.bg, component: cell.component });
                          setDrawerOpen(true);
                          toast.info(`${cell.bg} ${cell.component}: ${cell.units} units`);
                        }}
                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${color}`}
                        title={`${cell.units} units`}
                      >
                        <span className="text-[8px] font-bold text-white">{cell.units}</span>
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedCell ? `${selectedCell.bg} ${selectedCell.component}` : "Details"}
      >
        <div className="space-y-3 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Available Units</span>
            <span className="font-semibold">{Math.floor(Math.random() * 40) + 5}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">AI Predicted Demand (7d)</span>
            <span className="font-semibold">{Math.floor(Math.random() * 30) + 5}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Risk Level</span>
            <span className="font-semibold text-amber-600">MEDIUM</span>
          </div>
        </div>
      </DetailDrawer>
    </GlassCard>
  );
}