import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import { apiJson } from "../api";

type PlaceLike =
  | string
  | { id?: number; name?: string; code?: string; city?: string; country?: string }
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
  status: string;
  totalPrice: number;
  bookingDate: string;
  flight: FlightLike;

  seat?: { seatNumber?: string | null; seatOption?: SeatOption } | null;
  meal?: { mealOption?: MealOption } | null;
  baggage?: { baggageOption?: BaggageOption } | null;
};

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
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  const code = (v as any).code ? String((v as any).code) : "";
  const city = (v as any).city ? String((v as any).city) : "";
  const name = (v as any).name ? String((v as any).name) : "";
  if (code && city) return `${code} ${city}`;
  if (code) return code;
  if (name) return name;
  if (city) return city;
  return "—";
}

function flightFromLabel(f?: FlightLike | null) {
  const v = f?.from ?? f?.departureAirport;
  return placeLabel(v);
}
function flightToLabel(f?: FlightLike | null) {
  const v = f?.to ?? f?.arrivalAirport;
  return placeLabel(v);
}

const BG =
  "https://images.unsplash.com/photo-1552860512-13148a37d7a2?auto=format&fit=crop&w=2400&q=80";

export default function ReceiptPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = Number(sp.get("bookingId") ?? 0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [b, setB] = useState<BookingResponse | null>(null);

  // auth guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/receipt?bookingId=${bookingId}`)}`);
    }
  }, [navigate, bookingId]);

  useEffect(() => {
    if (!bookingId) {
      setErr("Missing bookingId.");
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const one = await apiJson<BookingResponse>(`/api/bookings/${bookingId}`);
        setB(one);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load receipt.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  const statusUpper = useMemo(() => (b?.status ?? "").toUpperCase(), [b?.status]);

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

        <div className="mx-auto max-w-4xl px-6 pb-16 pt-10">
          <div className="rounded-[30px] bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-3xl font-extrabold text-slate-900">Receipt</div>
                <div className="mt-1 text-sm text-slate-500">
                  Booking details and status.
                </div>
              </div>

              {b && (
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total</div>
                  <div className="text-3xl font-extrabold text-slate-900">{moneyTRY(b.totalPrice ?? 0)}</div>
                </div>
              )}
            </div>

            {loading && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Loading...
              </div>
            )}

            {!!err && !loading && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{err}</div>
            )}

            {!loading && b && (
              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-slate-900">Booking #{b.id}</div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        statusUpper === "CONFIRMED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : statusUpper === "CANCELLED"
                          ? "border-slate-200 bg-slate-100 text-slate-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {statusUpper || "—"}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    {flightFromLabel(b.flight)} → {flightToLabel(b.flight)}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Flight {b.flight?.flightNumber ?? "—"} · Departure{" "}
                    {b.flight?.departureTime ? fmtDateTime(b.flight.departureTime) : "—"} · Created{" "}
                    {b.bookingDate ? fmtDateTime(b.bookingDate) : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="text-sm font-extrabold text-slate-900">Selected services</div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500">Seat</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {b.seat?.seatOption?.seatType ?? b.seat?.seatOption?.seat_type ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Seat No: {b.seat?.seatNumber ?? "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500">Meal</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {b.meal?.mealOption?.name ?? "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500">Baggage</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {b.baggage?.baggageOption
                          ? `${b.baggage.baggageOption.weightKg ??
                              (b.baggage.baggageOption as any).weight_kg ??
                              0} kg`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate("/my-flights")}
                className="rounded-2xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Back to My Flights
              </button>

              <button
                onClick={() => navigate("/")}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
