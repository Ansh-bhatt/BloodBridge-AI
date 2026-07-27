"use client";
import { motion } from "framer-motion";
import { Siren } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GradientButton } from "@/components/shared/GradientButton";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function EmergencyFAB() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-xl shadow-rose-500/30"
      >
        <Siren size={24} />
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600">Emergency Blood Request</DialogTitle>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <motion.button
                key={bg}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(bg)}
                className={`rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
                  selected === bg
                    ? "border-rose-500 bg-rose-50 text-rose-600"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {bg}
              </motion.button>
            ))}
          </div>
          <div className="mt-4">
            <GradientButton
              variant="danger"
              className="w-full"
              onClick={() => {
                if (selected) {
                  toast.success(`Emergency broadcast sent for ${selected}`);
                  setOpen(false);
                  setSelected(null);
                } else {
                  toast.error("Select a blood group first");
                }
              }}
            >
              Broadcast Emergency Request
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
