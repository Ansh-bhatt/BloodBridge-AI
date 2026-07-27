"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface InventoryItem {
  id: string;
  hospital_id: string;
  blood_group: string;
  component: string;
  units_available: number;
  units_reserved: number;
  expiry_date: string;
  batch_id?: string;
  donation_date?: string;
  last_updated: string;
  units_total: number;
  status: string;
  days_until_expiry: number;
}

export function useInventory(hospitalId?: string) {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const path = hospitalId ? `/inventory/${hospitalId}` : "/inventory";
      const result = await api.get<InventoryItem[]>(path);
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
