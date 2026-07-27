"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Siren, Radio, Phone, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/GlassCard";
import { GradientButton } from "@/components/shared/GradientButton";
import { api } from "@/lib/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface Hospital {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
}

const mockResponses = [
  { hospital: "Apollo Hospital", units: 5, time: "2 min ago", status: "available" },
  { hospital: "Manipal Hospital", units: 3, time: "5 min ago", status: "available" },
  { hospital: "Fortis Healthcare", units: 0, time: "8 min ago", status: "unavailable" },
];

export default function EmergencyPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await api.get<Hospital[]>("/hospitals");
        setHospitals(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load hospitals");
      } finally {
        setLoadingHospitals(false);
      }
    };

    loadHospitals();
  }, []);

  const filteredHospitals = hospitals.filter((hospital) => {
    const search = hospitalSearch.toLowerCase();

    return (
      hospital.name.toLowerCase().includes(search) ||
      hospital.city?.toLowerCase().includes(search) ||
      hospital.address?.toLowerCase().includes(search)
    );
  });

  const handleBroadcast = async () => {
    if (!selectedHospital) {
      toast.error("Please select your hospital first");
      return;
    }

    if (!selected) {
      toast.error("Select a blood group first");
      return;
    }

    setBroadcasting(true);

    try {
      await api.post("/emergency", {
        requesting_hospital_id: selectedHospital.id,
        blood_group: selected,
        component: "RBC",
        units_needed: 5,
        priority: "URGENT",
      });

      setBroadcastSent(true);

      toast.success(`Emergency broadcast sent for ${selected}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send broadcast"
      );
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] -m-6 overflow-hidden rounded-none bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 p-8">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-rose-500 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-red-500 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl space-y-8">

        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30"
          >
            <Siren size={32} className="text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white">
            Emergency Blood Request
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Broadcast urgent requests to all network hospitals
          </p>
        </div>

        {/* Hospital Search */}
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Requesting Hospital
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder={
                loadingHospitals
                  ? "Loading hospitals..."
                  : "Search and select your hospital"
              }
              value={
                selectedHospital
                  ? selectedHospital.name
                  : hospitalSearch
              }
              disabled={loadingHospitals}
              onChange={(e) => {
                setSelectedHospital(null);
                setHospitalSearch(e.target.value);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-rose-400"
            />
          </div>

          {/* Search Results */}
          {!selectedHospital &&
            hospitalSearch.length > 0 &&
            filteredHospitals.length > 0 && (
              <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-800 p-2 shadow-xl">
                {filteredHospitals.map((hospital) => (
                  <button
                    key={hospital.id}
                    type="button"
                    onClick={() => {
                      setSelectedHospital(hospital);
                      setHospitalSearch("");
                    }}
                    className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-white/10"
                  >
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-rose-400"
                    />

                    <div>
                      <p className="text-sm font-medium text-white">
                        {hospital.name}
                      </p>

                      {(hospital.city || hospital.address) && (
                        <p className="mt-1 text-xs text-slate-400">
                          {hospital.city || hospital.address}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

          {!selectedHospital &&
            hospitalSearch.length > 0 &&
            filteredHospitals.length === 0 &&
            !loadingHospitals && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-slate-800 p-4 text-sm text-slate-400 shadow-xl">
                No hospitals found
              </div>
            )}

          {/* Selected Hospital */}
          {selectedHospital && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-emerald-400" />

                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedHospital.name}
                  </p>

                  <p className="text-xs text-emerald-400">
                    Hospital selected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedHospital(null);
                  setHospitalSearch("");
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Blood Groups */}
        <div className="grid grid-cols-4 gap-3">
          {BLOOD_GROUPS.map((bg) => (
            <motion.button
              key={bg}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(bg)}
              className={`rounded-xl border-2 px-4 py-4 text-center text-lg font-bold transition-all ${
                selected === bg
                  ? "border-rose-400 bg-rose-500/20 text-white shadow-lg shadow-rose-500/20"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {bg}
            </motion.button>
          ))}
        </div>

        {/* Broadcast Button */}
        <div className="text-center">
          {broadcastSent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Radio size={18} className="animate-pulse" />

                <span className="text-sm font-medium">
                  Broadcast active — waiting for responses
                </span>
              </div>
            </motion.div>
          ) : (
            <GradientButton
              variant="danger"
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="px-8 py-3 text-base font-semibold shadow-xl shadow-rose-500/20"
            >
              {broadcasting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Broadcasting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Radio size={18} />
                  Broadcast Emergency Request
                </span>
              )}
            </GradientButton>
          )}
        </div>

        {/* Response Feed */}
        {broadcastSent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard
              className="border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              hover={false}
            >
              <h2 className="mb-3 text-sm font-semibold text-white">
                Live Response Feed
              </h2>

              <div className="space-y-2">
                {mockResponses.map((resp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.3 }}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          resp.status === "available"
                            ? "bg-emerald-400"
                            : "bg-slate-500"
                        }`}
                      />

                      <div>
                        <p className="text-sm font-medium text-white">
                          {resp.hospital}
                        </p>

                        <p className="text-[10px] text-slate-400">
                          {resp.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          resp.status === "available"
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }`}
                      >
                        {resp.units > 0
                          ? `${resp.units} units`
                          : "None"}
                      </span>

                      {resp.units > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            toast.success(
                              `Call initiated to ${resp.hospital}`
                            )
                          }
                          className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30"
                        >
                          <Phone size={14} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

      </div>
    </div>
  );
}