"use client";
import { Bell, User } from "lucide-react";
import { motion } from "framer-motion";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/40 bg-white/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          <span className="text-xs font-medium text-emerald">Live Network</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-slate-700">City General Hospital</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose" />
        </motion.button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
