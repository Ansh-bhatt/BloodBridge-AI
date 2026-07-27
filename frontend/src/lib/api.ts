const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; detail: string };
}

function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("bb_token");
  }
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  
  // Handle 401/403 specifically
  if (res.status === 401) {
    throw new Error("Unauthorized — please log in again");
  }
  if (res.status === 403) {
    throw new Error("Forbidden — insufficient permissions");
  }
  
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error?.detail || "Request failed");
  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};

// Auth helpers
export const setToken = (token: string) => localStorage.setItem("bb_token", token);
export const removeToken = () => localStorage.removeItem("bb_token");
export const getStoredToken = () => getToken();