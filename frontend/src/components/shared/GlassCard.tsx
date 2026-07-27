import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export function GlassCard({ children, className, delay = 0, hover = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      className={cn(
        "rounded-xl border border-white/40 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur-xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
