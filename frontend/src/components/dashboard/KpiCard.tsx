"use client";
import { GlassCard } from "@/components/shared/GlassCard";
import { CountUp } from "@/components/shared/CountUp";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend: number[];
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function KpiCard({ label, value, icon: Icon, color, trend, prefix, suffix, delay = 0 }: KpiCardProps) {
  const data = trend.map((v, i) => ({ v, i }));
  return (
    <GlassCard delay={delay} className="p-6">
      <div className="flex items-start justify-between">
        <span
          className="rounded-xl p-3"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon size={22} />
        </span>
        <div className="h-12 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} fill={`url(#grad-${label})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tabular-nums">
        <CountUp end={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </GlassCard>
  );
}
