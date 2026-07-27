"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BrainCircuit, ArrowLeftRight, Siren, Droplets } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/predictions", label: "Predictions", icon: BrainCircuit },
  { href: "/redistribution", label: "Redistribution", icon: ArrowLeftRight },
  { href: "/emergency", label: "Emergency", icon: Siren },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-600">
          <Droplets size={20} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-red-400">BloodBridge</p>
          <p className="text-[10px] font-semibold tracking-wider text-slate-400">AI Platform</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-red-500 to-rose-500"
                  />
                )}
                <item.icon size={18} className={isActive ? "text-red-400" : ""} />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-[10px] text-slate-500">v1.0.0 • Hackathon Demo</p>
      </div>
    </aside>
  );
}
