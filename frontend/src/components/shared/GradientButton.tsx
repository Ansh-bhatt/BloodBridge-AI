import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "danger";
}

export function GradientButton({ children, className, variant = "primary", ...props }: GradientButtonProps) {
  const gradient = variant === "danger"
    ? "from-rose-600 to-red-700"
    : "from-red-600 to-rose-600";
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-lg bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white shadow-md transition-shadow hover:shadow-lg",
        gradient,
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
