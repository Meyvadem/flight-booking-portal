// frontend/src/api.ts
export function authExpiredRedirectHome() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  window.location.href = "/";
}

export type ApiError = Error & { status?: number; body?: string };

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
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
