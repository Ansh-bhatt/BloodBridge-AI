"use client";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

interface Hospital {
  id: string;
  name: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const miniBarData = [
  { bg: "A+", units: 42 },
  { bg: "B+", units: 35 },
  { bg: "O+", units: 58 },
  { bg: "AB+", units: 18 },
];

function AvailabilityRing({ percent }: { percent: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const color = percent >= 70 ? "#10B981" : percent >= 30 ? "#F59E0B" : "#E11D48";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" className="fill-slate-700 text-[9px] font-semibold">
        {Math.round(percent)}
      </text>
    </svg>
  );
}

export function RegionalGrid() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    api.get<Hospital[]>("/hospitals").then(setHospitals).catch(() => {});
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {hospitals.map((hospital, i) => (
        <GlassCard key={hospital.id} delay={0.05 * i} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-800">{hospital.name}</h3>
              <p className="text-xs text-slate-500">{hospital.city || "India"}</p>
            </div>
            <AvailabilityRing percent={50 + Math.random() * 45} />
          </div>
          <div className="mt-4 space-y-1.5">
            {miniBarData.map((d) => (
              <div key={d.bg} className="flex items-center gap-2">
                <span className="w-7 text-[10px] font-medium text-slate-500">{d.bg}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                    style={{ width: `${Math.min(100, d.units * 1.5)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-600">{d.units}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge label="Active" variant="success" />
          </div>
        </GlassCard>
      ))}
      {hospitals.length === 0 && (
        <div className="col-span-full text-center text-sm text-slate-400 py-8">
          Loading hospitals...
        </div>
      )}
    </div>
  );
}
