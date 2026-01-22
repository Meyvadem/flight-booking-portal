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

type AirlineFareTypeLike = {
  includedBaggageKg?: number;
  fareType?: any;
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
  airlineFareType: AirlineFareTypeLike;

  seat?: { seatNumber?: string | null; seatOption?: SeatOption } | null;
  meal?: { mealOption?: MealOption } | null;
  baggage?: { baggageOption?: BaggageOption } | null;
};

type PaymentResponse = {
  amount: number;
  bookingId: number;
  bookingStatus: string; // CONFIRMED
  paymentDate: string; // ISO
  paymentId: number;
  status: string; // SUCCESS
};

/* ------- Helpers ------- */
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

/* ------- Card validation (UI only) ------- */
function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function formatCardNumber(raw: string) {
  const d = onlyDigits(raw).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function luhnCheck(cardNumberDigits: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumberDigits.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumberDigits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isValidCardNumber(raw: string) {
  const digits = onlyDigits(raw);
  if (digits.length < 13 || digits.length > 19) return false;
  return luhnCheck(digits);
}

function isValidCvc(raw: string) {
  const d = onlyDigits(raw);
  return d.length === 3;
}

function isValidName(raw: string) {
  return raw.trim().length >= 2;
}

function isExpired(mm: string, yyyy: string) {
  const m = Number(mm);
  const y = Number(yyyy);
  if (!m || !y) return true;


  const boundary = new Date(y, m, 1);
  const now = new Date();
  return boundary <= now;
}

/* ------- Page ------- */
const BG =
  "https://images.unsplash.com/photo-1512734099960-65a682cbfe2b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const SUCCESS_LOCK_KEY = "paymentSuccessLock_v1";

export default function PaymentPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = sp.get("bookingId");
  const outBookingId = sp.get("outBookingId");
  const retBookingId = sp.get("retBookingId");

  const bookingIds = useMemo(() => {
    if (bookingId) return [Number(bookingId)];
    if (outBookingId && retBookingId) return [Number(outBookingId), Number(retBookingId)];
    return [];
  }, [bookingId, outBookingId, retBookingId]);

  const [bookings, setBookings] = useState<Record<number, BookingResponse>>({});
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");
  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  // card form state
  const [holderName, setHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");

  const total = useMemo(() => {
    return bookingIds.reduce((sum, id) => sum + (bookings[id]?.totalPrice ?? 0), 0);
  }, [bookingIds, bookings]);


  useEffect(() => {
    const lock = sessionStorage.getItem(SUCCESS_LOCK_KEY);
    if (lock === "1") {
      sessionStorage.removeItem(SUCCESS_LOCK_KEY);
      navigate("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bookingIds.length === 0) {
      setErr("Missing booking id(s).");
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const list = await Promise.all(
          bookingIds.map((id) => apiJson<BookingResponse>(`/api/bookings/${id}`))
        );
        const map: Record<number, BookingResponse> = {};
        for (const b of list) map[b.id] = b;
        setBookings(map);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingIds.join(",")]);

  // each booking must have seat+meal+baggage selected
  const selectionsOk = useMemo(() => {
    if (bookingIds.length === 0) return false;
    return bookingIds.every((id) => {
      const b = bookings[id];
      if (!b) return false;

      const seatOk = !!b.seat?.seatOption?.id;
      const mealOk = !!b.meal?.mealOption?.id;
      const bagOk = !!b.baggage?.baggageOption?.id;

      return seatOk && mealOk && bagOk;
    });
  }, [bookingIds, bookings]);

  const allConfirmed = useMemo(() => {
    if (bookingIds.length === 0) return false;
    return bookingIds.every((id) => bookings[id]?.status === "CONFIRMED");
  }, [bookingIds, bookings]);

  // form validation
  const nameOk = useMemo(() => isValidName(holderName), [holderName]);
  const cardOk = useMemo(() => isValidCardNumber(cardNumber), [cardNumber]);
  const cvcOk = useMemo(() => isValidCvc(cvc), [cvc]);
  const expOk = useMemo(() => {
    if (!expMonth || !expYear) return false;
    return !isExpired(expMonth, expYear);
  }, [expMonth, expYear]);

  const formOk = nameOk && cardOk && expOk && cvcOk;

  async function payOne(id: number) {
    return await apiJson<PaymentResponse>(`/api/bookings/${id}/pay`, { method: "POST" });
  }

  async function handlePay() {
    if (bookingIds.length === 0) return;

    if (!selectionsOk) {
      setErr("Please complete Seat + Meal + Baggage selections for all flights before paying.");
      return;
    }
    if (!formOk) {
      setErr("Please enter valid card details before paying.");
      return;
    }
    if (allConfirmed) {
      setErr("This booking is already confirmed.");
      return;
    }

    setPaying(true);
    setErr("");
    try {
      const res = await Promise.all(bookingIds.map((id) => payOne(id)));
      setPayments(res);

      // refresh bookings to show CONFIRMED
      const list = await Promise.all(
        bookingIds.map((id) => apiJson<BookingResponse>(`/api/bookings/${id}`))
      );
      const map: Record<number, BookingResponse> = {};
      for (const b of list) map[b.id] = b;
      setBookings(map);
    } catch (e: any) {
      setErr(e?.message ?? "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  // Success modal açıkken:
  // - back tuşu -> direkt home
  // - refresh olursa bir sonraki açılışta home'a atmak için lock bırak
  useEffect(() => {
    if (payments.length === 0) return;

    sessionStorage.setItem(SUCCESS_LOCK_KEY, "1");

    // back/forward yakala
    window.history.pushState({ paySuccess: true }, "");
    const onPopState = () => {
      sessionStorage.removeItem(SUCCESS_LOCK_KEY);
      navigate("/", { replace: true });
    };
    window.addEventListener("popstate", onPopState);

    // refresh / tab kapama uyarısı (browser bunu zorunlu yapar)
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [payments.length, navigate]);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    []
  );
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => String(now + i));
  }, []);

  // modal açıkken her şeyi kilitle
  const modalOpen = payments.length > 0;

  const payDisabled =
    modalOpen || paying || bookingIds.length === 0 || !selectionsOk || !formOk || allConfirmed;

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

        <div className="mx-auto max-w-5xl px-6 pb-16 pt-10">
          <div className="rounded-[30px] bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-3xl font-extrabold text-slate-900">Payment</div>
                <div className="mt-1 text-sm text-slate-500">
                  Review your booking and complete the payment.
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-3xl font-extrabold text-slate-900">{moneyTRY(total)}</div>
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

            {!loading && bookingIds.length > 0 && (
              <div className="mt-7 space-y-4">
                {bookingIds.map((id) => {
                  const b = bookings[id];

                  const seatOk = !!b?.seat?.seatOption?.id;
                  const mealOk = !!b?.meal?.mealOption?.id;
                  const bagOk = !!b?.baggage?.baggageOption?.id;

                  return (
                    <div key={id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          Booking #{id} · Status:{" "}
                          <span className={b?.status === "CONFIRMED" ? "text-emerald-700" : "text-orange-700"}>
                            {b?.status ?? "—"}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-emerald-700">
                          {moneyTRY(b?.totalPrice ?? 0)}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-slate-700">
                        {flightFromLabel(b?.flight)} → {flightToLabel(b?.flight)} ·{" "}
                        {b?.flight?.departureTime ? fmtDateTime(b.flight.departureTime) : "—"}
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        Seat:{" "}
                        <span className={seatOk ? "text-slate-800" : "text-red-700"}>
                          {b?.seat?.seatOption?.seatType ?? b?.seat?.seatOption?.seat_type ?? "—"}
                          {b?.seat?.seatNumber ? ` (${b.seat.seatNumber})` : ""}
                        </span>
                        {" · "}
                        Meal:{" "}
                        <span className={mealOk ? "text-slate-800" : "text-red-700"}>
                          {b?.meal?.mealOption?.name ?? "—"}
                        </span>
                        {" · "}
                        Baggage:{" "}
                        <span className={bagOk ? "text-slate-800" : "text-red-700"}>
                          {b?.baggage?.baggageOption
                            ? `${b.baggage.baggageOption.weightKg ?? (b.baggage.baggageOption as any).weight_kg ?? 0} kg`
                            : "—"}
                        </span>
                      </div>

                      {(!seatOk || !mealOk || !bagOk) && (
                        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                          Please complete missing selections for this booking before paying.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Card form */}
            <div className="mt-8">
              <div className="mb-2 text-sm font-semibold text-slate-900">Card details</div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <input
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                      holderName.length === 0 ? "border-slate-200" : nameOk ? "border-slate-200" : "border-red-300"
                    }`}
                    placeholder="Card holder name"
                    autoComplete="cc-name"
                    disabled={modalOpen}
                  />
                  {!nameOk && holderName.length > 0 && (
                    <div className="mt-1 text-xs text-red-600">Name must be at least 2 characters.</div>
                  )}
                </div>

                <div>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    inputMode="numeric"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                      cardNumber.length === 0 ? "border-slate-200" : cardOk ? "border-slate-200" : "border-red-300"
                    }`}
                    placeholder="Card number"
                    autoComplete="cc-number"
                    disabled={modalOpen}
                  />
                  {!cardOk && onlyDigits(cardNumber).length > 0 && (
                    <div className="mt-1 text-xs text-red-600">Invalid card number.</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                        expMonth === "" ? "border-slate-200" : expOk ? "border-slate-200" : "border-red-300"
                      }`}
                      autoComplete="cc-exp-month"
                      disabled={modalOpen}
                    >
                      <option value="">MM</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                        expYear === "" ? "border-slate-200" : expOk ? "border-slate-200" : "border-red-300"
                      }`}
                      autoComplete="cc-exp-year"
                      disabled={modalOpen}
                    >
                      <option value="">YYYY</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!expOk && (expMonth || expYear) && (
                    <div className="col-span-2 -mt-2 text-xs text-red-600">Expiry date is invalid or expired.</div>
                  )}
                </div>

                <div>
                  <input
                    value={cvc}
                    onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 3))}
                    inputMode="numeric"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                      cvc.length === 0 ? "border-slate-200" : cvcOk ? "border-slate-200" : "border-red-300"
                    }`}
                    placeholder="CVC"
                    autoComplete="cc-csc"
                    disabled={modalOpen}
                  />
                  {!cvcOk && cvc.length > 0 && (
                    <div className="mt-1 text-xs text-red-600">CVC must be 3 digits.</div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Note: Card details are validated on UI only and are not stored.
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate(-1)}
                disabled={modalOpen}
                className={`rounded-2xl px-6 py-3 text-sm font-semibold ${
                  modalOpen
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Back
              </button>

              <button
                onClick={handlePay}
                disabled={payDisabled}
                title={
                  modalOpen
                    ? "Payment completed"
                    : allConfirmed
                    ? "Already confirmed"
                    : !selectionsOk
                    ? "Complete selections for all flights"
                    : !formOk
                    ? "Enter valid card details"
                    : ""
                }
                className={`rounded-2xl px-6 py-3 text-sm font-semibold text-white ${
                  payDisabled ? "cursor-not-allowed bg-orange-600/40 text-white/80" : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {paying ? "Processing..." : allConfirmed || modalOpen ? "Paid" : "Pay"}
              </button>
            </div>
          </div>
        </div>

        {/* SUCCESS MODAL (Go Home zorunlu) */}
        {payments.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

            <div className="relative w-[92%] max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">Payment successful ✅</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Your booking has been confirmed. Please return to Home.
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-700">
                  {moneyTRY(payments.reduce((sum, p) => sum + (p.amount ?? 0), 0))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {payments.length === 1
                  ? `Payment #${payments[0].paymentId} processed successfully.`
                  : `${payments.length} payments processed successfully.`}
              </div>

              <button
                onClick={() => {
                  sessionStorage.removeItem(SUCCESS_LOCK_KEY);
                  navigate("/", { replace: true });
                }}
                className="mt-6 w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Go Home
              </button>

              <div className="mt-3 text-center text-xs text-slate-500">
                You cannot continue without returning to Home.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
