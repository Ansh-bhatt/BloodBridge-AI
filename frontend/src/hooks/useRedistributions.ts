"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Redistribution {
  id: string;
  source_hospital_id: string;
  target_hospital_id: string;
  blood_group: string;
  component: string;
  units: number;
  status: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  estimated_travel_time_mins?: number;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export function useRedistributions() {
  const [data, setData] = useState<Redistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.get<Redistribution[]>("/redistribution");
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
