import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import { apiJson, apiVoid } from "../api";

/* ---- types (Ancillaries/Payment ile uyumlu) ---- */
type PlaceLike =
  | string
  | { code?: string; city?: string; name?: string }
  | null
  | undefined;



type FlightLike = {
  flightNumber: string;
  airlineCode?: string;
  airlineName?: string;
  airline?: { code?: string; name?: string };
  from?: PlaceLike;
  to?: PlaceLike;
  departureAirport?: PlaceLike;
  arrivalAirport?: PlaceLike;
  departureTime: string;
  arrivalTime: string;
};

type SeatOption = { id: number; seatType?: string; seat_type?: string; price: number };
type MealOption = { id: number; name: string; price: number };
type BaggageOption = { id: number; weightKg?: number; weight_kg?: number; price: number };

type BookingResponse = {
  id: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | string;
  totalPrice: number;
  bookingDate: string;
  flight: FlightLike;

  seat?: { seatNumber?: string | null; seatOption?: SeatOption } | null;
  meal?: { mealOption?: MealOption } | null;
  baggage?: { baggageOption?: BaggageOption } | null;
};

/* ---- helpers ---- */
function moneyTRY(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

function placeLabel(v: PlaceLike) {
  if (!v) return "—";
  if (typeof v === "string") return v;

  const code = v.code ?? "";
  const city = v.city ?? "";
  const name = v.name ?? "";

  if (code && city) return `${code} ${city}`;
  if (code) return code;
  if (name) return name;
  return "—";
}

function flightFromLabel(f: any) {
  return placeLabel(f?.from ?? f?.departureAirport);
}

function flightToLabel(f: any) {
  return placeLabel(f?.to ?? f?.arrivalAirport);
}

const BG =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=2400&q=80";

type FilterKey = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED";

export default function MyFlightsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [q, setQ] = useState("");

  

  // auth guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent("/my-flights")}`);
    }
  }, [navigate]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // 1) /api/bookings/my (varsa)
      try {
        const mine = await apiJson<BookingResponse[]>("/api/bookings/my");
        setItems(mine ?? []);
        return;
      } catch (e: any) {
        // 404 ise diğer endpoint'e düş
        const msg = String(e?.message ?? "");
        if (!msg.startsWith("404")) throw e;
      }

      // 2) /api/bookings (bazı projelerde bu kullanıcıya göre filtrelenmiş döner)
      const all = await apiJson<BookingResponse[]>("/api/bookings");
      setItems(all ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return (items ?? [])
      .filter((b) => {
        
        if (filter === "ALL") return true;
        return (b.status ?? "").toUpperCase() === filter;
      })
      .filter((b) => {
        
        if (!text) return true;
        const s = [
          b.id,
          b.status,
          b.flight?.flightNumber,
          flightFromLabel(b.flight),
          flightToLabel(b.flight),
          b.flight?.airlineName ?? b.flight?.airline?.name,
        ]
          .join(" ")
          .toLowerCase();
        return s.includes(text);
      })
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }, [items, filter, q]);

  

  async function cancelBooking(id: number) {
    const ok = window.confirm("Cancel this booking?");
    if (!ok) return;

    try {
      await apiVoid(`/api/bookings/${id}/cancel`, { method: "PUT" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Cancel failed.");
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

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
          <div className="rounded-[30px] bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-3xl font-extrabold text-slate-900">My Flights</div>
                <div className="mt-1 text-sm text-slate-500">
                  Your bookings and receipts.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search booking..."
                  className="w-56 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                />

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterKey)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  onClick={load}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Loading...
              </div>
            )}

            {!!err && !loading && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{err}</div>
            )}

            {!loading && !err && filtered.length === 0 && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
                No bookings found.
              </div>
            )}

            {!loading && !err && filtered.length > 0 && (
              <div className="mt-7 space-y-4">
                {filtered.map((b) => {
                  const status = (b.status ?? "").toUpperCase();
                  const badge =
                    status === "CONFIRMED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : status === "CANCELLED"
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-amber-50 text-amber-800 border-amber-200";

                  return (
                    <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-extrabold text-slate-900">
                              Booking #{b.id}
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badge}`}>
                              {status || "—"}
                            </span>
                          </div>

                          <div className="mt-2 text-sm text-slate-700">
                           {flightFromLabel(b.flight)} <span className="text-slate-400">→</span> {flightToLabel(b.flight)}
                            {b.flight?.departureTime ? fmtDateTime(b.flight.departureTime) : "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Flight {b.flight?.flightNumber ?? "—"} · Created{" "}
                            {b.bookingDate ? fmtDateTime(b.bookingDate) : "—"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-500">Total</div>
                          <div className="text-lg font-extrabold text-emerald-700">
                            {moneyTRY(b.totalPrice ?? 0)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-600">
                          Seat:{" "}
                          {b.seat?.seatOption?.seatType ??
                            b.seat?.seatOption?.seat_type ??
                            "—"}
                          {b.seat?.seatNumber ? ` (${b.seat.seatNumber})` : ""}{" "}
                          · Meal: {b.meal?.mealOption?.name ?? "—"} · Baggage:{" "}
                          {b.baggage?.baggageOption
                            ? `${b.baggage.baggageOption.weightKg ??
                                (b.baggage.baggageOption as any).weight_kg ??
                                0} kg`
                            : "—"}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/receipt?bookingId=${b.id}`)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            View receipt
                          </button>

                          {status === "PENDING" && (
  <div className="flex items-center gap-2">
    <button
      onClick={() => navigate(`/ancillaries?bookingId=${b.id}`)}
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Continue
    </button>

    <button
      onClick={() => cancelBooking(b.id)}
      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
    >
      Cancel
    </button>
  </div>
)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={() => navigate("/")}
                className="rounded-2xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
