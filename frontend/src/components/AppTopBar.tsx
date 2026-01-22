// frontend/src/components/AppTopBar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoPng from "../assets/logo4.png";

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getDisplayNameFromToken(token: string | null) {
  if (!token) return null;
  const p = decodeJwtPayload(token);
  if (!p) return "Account";

  const fullName =
    p.fullName ||
    p.name ||
    (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : null) ||
    (p.given_name && p.family_name ? `${p.given_name} ${p.family_name}` : null) ||
    p.email ||
    p.sub;

  return fullName || "Account";
}

export default function AppTopBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const displayName = useMemo(() => getDisplayNameFromToken(token), [token]);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
  onClick={() => navigate("/")}
  className="flex items-center gap-3"
  type="button"
>
  <img
  src={logoPng}
  alt="FlyAway logo"
  className="h-12 w-12 object-contain"
/>
  <div className="text-lg font-semibold tracking-wide text-white">FlyAway</div>
</button>

        {!token ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-white/15 px-6 py-3 text-base text-white hover:bg-white/20"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100"
            >
              Register
            </button>
          </div>
        ) : (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
            >
              <span className="max-w-[220px] truncate">{displayName}</span>
              <span className="text-white/70">▾</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-xl backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={() => navigate("/my-flights")}
                  className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10"
                >
                  My Flights
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
