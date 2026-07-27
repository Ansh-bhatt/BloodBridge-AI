"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Prediction {
  id: string;
  hospital_id: string;
  blood_group: string;
  component: string;
  predicted_shortage_units: number | null;
  predicted_demand_next_7d: number;
  predicted_demand_next_30d: number;
  risk_score: number;
  risk_level: string;
  confidence_score: number;
  explanation: {
    top_features: Array<{ feature: string; impact: number; direction: string }>;
    summary: string;
  };
  created_at: string;
}

export function usePredictions(hospitalId?: string) {
  const [data, setData] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = hospitalId
        ? await api.get<Prediction[]>(`/predictions/${hospitalId}`)
        : [];
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.post<Prediction[]>("/predictions/refresh");
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch: fetch, refresh };
}
