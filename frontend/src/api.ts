// frontend/src/api.ts
export function authExpiredRedirectHome() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail"); // bunu da temizle

  // replace daha temiz (geri tuşunda expired sayfaya dönmez)
  window.location.replace("/");
}

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

  // ✅ Her sayfada ortak davranış
  if (res.status === 401 || res.status === 403) {
    authExpiredRedirectHome();
    throw new Error("AUTH_EXPIRED");
  }

  return res;
}

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(url, init);

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${t || res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function apiVoid(url: string, init?: RequestInit): Promise<void> {
  const res = await apiFetch(url, init);

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${t || res.statusText}`);
  }
}
