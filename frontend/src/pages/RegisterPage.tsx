import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import { apiJson } from "../api";

type RegisterResponse = { token: string };

const BG =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=2400&q=80";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidName(name: string) {
  return name.trim().length >= 2;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const redirect = sp.get("redirect") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const nameOk = useMemo(() => isValidName(name), [name]);
  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const pwOk = useMemo(() => pw.trim().length >= 6, [pw]);
  const pwMatch = useMemo(() => pw.length > 0 && pw === pw2, [pw, pw2]);

  const formOk = nameOk && emailOk && pwOk && pwMatch;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!nameOk) return setErr("Name must be at least 2 characters.");
    if (!emailOk) return setErr("Invalid email format.");
    if (!pwOk) return setErr("Password must be at least 6 characters.");
    if (!pwMatch) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      // ✅ Backend endpoint'in /api/auth/register ise bunu kullan
      // Eğer sende /api/auth/signup gibi farklıysa burayı değiştir.
      const data = await apiJson<RegisterResponse>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: pw,
        }),
      });

      // token geldiyse kaydet + yönlendir
      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", email.trim());
      }

      navigate(redirect, { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Register failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen bg-black/35">
        <AppTopBar />

        <div className="mx-auto max-w-xl px-6 pb-16 pt-10">
          <div className="rounded-[30px] bg-white p-8 shadow-xl">
            <div className="text-3xl font-extrabold text-slate-900">Register</div>
            <div className="mt-1 text-sm text-slate-500">Create your FlyAway account.</div>

            {!!err && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{err}</div>
            )}

            <form onSubmit={handleRegister} className="mt-7 space-y-4">
              <div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    name.length === 0 ? "border-slate-200" : nameOk ? "border-slate-200" : "border-red-300"
                  }`}
                  placeholder="Full name"
                  autoComplete="name"
                />
                {!nameOk && name.length > 0 && (
                  <div className="mt-1 text-xs text-red-600">Name must be at least 2 characters.</div>
                )}
              </div>

              <div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    email.length === 0 ? "border-slate-200" : emailOk ? "border-slate-200" : "border-red-300"
                  }`}
                  placeholder="Email"
                  autoComplete="email"
                />
                {!emailOk && email.length > 0 && <div className="mt-1 text-xs text-red-600">Invalid email format.</div>}
              </div>

              <div>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    pw.length === 0 ? "border-slate-200" : pwOk ? "border-slate-200" : "border-red-300"
                  }`}
                  placeholder="Password"
                  autoComplete="new-password"
                />
                {!pwOk && pw.length > 0 && (
                  <div className="mt-1 text-xs text-red-600">Password must be at least 6 characters.</div>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    pw2.length === 0 ? "border-slate-200" : pwMatch ? "border-slate-200" : "border-red-300"
                  }`}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
                {!pwMatch && pw2.length > 0 && (
                  <div className="mt-1 text-xs text-red-600">Passwords do not match.</div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !formOk}
                className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white ${
                  loading || !formOk
                    ? "cursor-not-allowed bg-orange-600/40 text-white/80"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {loading ? "Creating account..." : "Register"}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
                className="w-full rounded-2xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                I already have an account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
