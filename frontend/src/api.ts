// frontend/src/api.ts

export function authExpiredRedirectHome() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  window.location.href = "/";
}

export type ApiError = Error & { status?: number; body?: string };

// ✅ A+B uyumlu base URL
// - AWS/Render gibi A modelinde: VITE_API_BASE_URL="http(s)://<backend-host>:8080"
// - B modelinde (tek domain): boş bırak -> "/api/..." aynı origin'de çalışır
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString().replace(/\/$/, "") ?? "";

function withBase(url: string) {
  if (!API_BASE) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("token");

  const res = await fetch(withBase(url), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    authExpiredRedirectHome();
    const err = new Error("AUTH_EXPIRED") as ApiError;
    err.status = res.status;
    throw err;
  }

  return res;
}

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(url, init);

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    const err = new Error(t || res.statusText) as ApiError;
    err.status = res.status;
    err.body = t;
    throw err;
  }

  return (await res.json()) as T;
}

export async function apiVoid(url: string, init?: RequestInit): Promise<void> {
  const res = await apiFetch(url, init);

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    const err = new Error(t || res.statusText) as ApiError;
    err.status = res.status;
    err.body = t;
    throw err;
  }
}
