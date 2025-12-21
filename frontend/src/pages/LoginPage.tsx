import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TopBar from "../components/AppTopBar";
import { apiJson } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const redirect = useMemo(() => sp.get("redirect") || "/", [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setErr("");
  setLoading(true);

  try {
    const json = await apiJson<{ token: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const token = json?.token;
    if (!token) throw new Error("Login response has no token.");

    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", email);

    navigate(decodeURIComponent(redirect));
  } catch (e: any) {
    setErr(e?.message || "Login failed.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />

      <div className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow">
          <div className="text-2xl font-extrabold text-slate-900">Sign In</div>
          <div className="mt-1 text-sm text-slate-500">
            Continue to booking by signing in.
          </div>

          {err && (
            <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg ${
                loading
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
