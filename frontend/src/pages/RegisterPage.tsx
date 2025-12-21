import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import { apiJson } from "../api";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function RegisterPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const redirect = sp.get("redirect") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const passOk = useMemo(() => password.length >= 6, [password]); // backend daha farklı istiyorsa artırabilirsin
  const confirmOk = useMemo(() => confirm === password && confirm.length > 0, [confirm, password]);

  const formOk = nameOk && emailOk && passOk && confirmOk;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!formOk) return;

    setLoading(true);
    try {
      const json = await apiJson<{ token: string }>(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const token = json?.token;
      if (!token) throw new Error("Register response has no token.");

      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", email.trim());

      navigate(decodeURIComponent(redirect));
    } catch (e: any) {
      // apiJson zaten status + text döndürüyor
      setErr(e?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppTopBar />

      <div className="mx-auto max-w-lg px-6 py-12">
        <div className="rounded-[28px] bg-white p-8 shadow-xl">
          <div className="text-3xl font-extrabold text-slate-900">Create account</div>
          <div className="mt-1 text-sm text-slate-500">
            Register to book flights and manage your bookings.
          </div>

          {!!err && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {err}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  name.length === 0 ? "border-slate-200" : nameOk ? "border-slate-200" : "border-red-300"
                }`}
                placeholder="Jane Doe"
                autoComplete="name"
              />
              {!nameOk && name.length > 0 && (
                <div className="mt-1 text-xs text-red-600">Name must be at least 2 characters.</div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  email.length === 0 ? "border-slate-200" : emailOk ? "border-slate-200" : "border-red-300"
                }`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {!emailOk && email.length > 0 && (
                <div className="mt-1 text-xs text-red-600">Enter a valid email address.</div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  password.length === 0 ? "border-slate-200" : passOk ? "border-slate-200" : "border-red-300"
                }`}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
              {!passOk && password.length > 0 && (
                <div className="mt-1 text-xs text-red-600">Password must be at least 6 characters.</div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  confirm.length === 0 ? "border-slate-200" : confirmOk ? "border-slate-200" : "border-red-300"
                }`}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              {!confirmOk && confirm.length > 0 && (
                <div className="mt-1 text-xs text-red-600">Passwords do not match.</div>
              )}
            </div>

            <button
              type="submit"
              disabled={!formOk || loading}
              className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                !formOk || loading
                  ? "cursor-not-allowed bg-orange-600/40"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {loading ? "Creating..." : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
              className="w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              I already have an account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
