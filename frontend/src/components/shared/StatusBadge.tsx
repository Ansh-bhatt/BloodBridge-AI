import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "info";

const variantStyles: Record<Variant, string> = {
  success: "bg-emerald/10 text-emerald",
  warning: "bg-amber/10 text-amber",
  danger: "bg-rose/10 text-rose",
  info: "bg-blue-500/10 text-blue-500",
};

const dotColors: Record<Variant, string> = {
  success: "bg-emerald",
  warning: "bg-amber",
  danger: "bg-rose",
  info: "bg-blue-500",
};

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  pulse?: boolean;
}

export function StatusBadge({ label, variant = "success", pulse }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", variantStyles[variant])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant], pulse && "animate-pulse")} />
      {label}
    </span>
  );
}
