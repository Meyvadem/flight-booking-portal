import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import { apiJson, apiVoid } from "../api";

type SeatOption = { id: number; seatType?: string; seat_type?: string; price: number };
type MealOption = { id: number; name: string; price: number };
type BaggageOption = { id: number; weightKg?: number; weight_kg?: number; price: number };

type PlaceLike =
  | string
  | {
      id?: number;
      name?: string;
      code?: string;
      city?: string;
      country?: string;
    }
  | null
  | undefined;

/** Backend flight bazen farklı shape döndürüyor (from/to veya departureAirport/arrivalAirport) */
type FlightLike = {
  id?: number;
  flightId?: number;
  flightNumber: string;

  airlineCode?: string;
  airlineName?: string;
  airline?: { code?: string; name?: string };

  // our old DTO
  from?: PlaceLike;
  to?: PlaceLike;

  // your real backend payload
  departureAirport?: PlaceLike;
  arrivalAirport?: PlaceLike;

  departureTime: string;
  arrivalTime: string;
  basePrice?: number;
};

type AirlineFareTypeLike = {
  id?: number;
  airlineFareTypeId?: number;

  includedBaggageKg?: number;
  extraPrice?: number;

  // can be string or object
  fareType?: any;

  // nested airline
  airline?: { code?: string; name?: string };
};

type BookingResponse = {
  id: number;
  status: string;
  totalPrice: number;
  bookingDate: string;

  flight: FlightLike;
  airlineFareType: AirlineFareTypeLike;

  baggage?:
    | {
        id: number;
        price: number;
        baggageOption?: BaggageOption;
      }
    | null;

  meal?:
    | {
        id: number;
        price: number;
        mealOption?: MealOption;
      }
    | null;

  seat?:
    | {
        id: number;
        price: number;
        seatNumber?: string | null;
        seatOption?: SeatOption;
      }
    | null;
};

type StepKey = "seat" | "meal" | "baggage";

// ✅ NEW BG (you can swap easily)
const BG = "https://plus.unsplash.com/premium_photo-1719943510748-4b4354fbcf56?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";



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
  const id = (v as any).id != null ? String((v as any).id) : "";

  if (code && city) return `${code} ${city}`;
  if (code) return code;
  if (name) return name;
  if (city) return city;
  if (id) return `#${id}`;
  return "—";
}

function flightFromLabel(f: FlightLike | null | undefined) {
  if (!f) return "—";
  const v = f.from ?? f.departureAirport;
  return placeLabel(v);
}
function flightToLabel(f: FlightLike | null | undefined) {
  if (!f) return "—";
  const v = f.to ?? f.arrivalAirport;
  return placeLabel(v);
}
function airlineLabel(f: FlightLike | null | undefined) {
  if (!f) return "—";
  const name = f.airlineName ?? f.airline?.name ?? "—";
  const code = f.airlineCode ?? f.airline?.code ?? "";
  return code ? `${name} (${code})` : name;
}
function fareNameLabel(aft: AirlineFareTypeLike | null | undefined) {
  if (!aft) return "—";
  const ft = (aft as any).fareType;
  if (!ft) return "—";
  if (typeof ft === "string") return ft;
  if (typeof ft?.name === "string") return ft.name;
  return "—";
}
function includedBaggageLabel(aft: AirlineFareTypeLike | null | undefined) {
  const kg = aft?.includedBaggageKg ?? 0;
  return `${kg}kg`;
}
function seatTypeLabel(o: SeatOption) {
  return o.seatType ?? (o as any).seat_type ?? "Seat";
}
function baggageKgLabel(o: BaggageOption) {
  const kg = o.weightKg ?? (o as any).weight_kg ?? 0;
  return `${kg} kg`;
}


export default function AncillariesPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();


  const promptingRef = useRef(false);
const allowNavRef = useRef(false);
const cancelingRef = useRef(false);

function getResultsUrl() {
  return sessionStorage.getItem("lastResultsUrl") || "/results";
}

async function cancelAll() {
  if (cancelingRef.current) return;
  cancelingRef.current = true;
  try {
    await Promise.all(
      bookingIds.map((id) =>
        apiVoid(`/api/bookings/${id}/cancel`, { method: "PUT" }).catch(() => {})
      )
    );
  } finally {
    cancelingRef.current = false;
  }
}

  const outBookingId = sp.get("outBookingId");
  const retBookingId = sp.get("retBookingId");
  const bookingId = sp.get("bookingId");

  const isRoundTrip = !!(outBookingId && retBookingId);

  const bookingIds = useMemo(() => {
    if (bookingId) return [Number(bookingId)];
    if (outBookingId && retBookingId) return [Number(outBookingId), Number(retBookingId)];
    return [];
  }, [bookingId, outBookingId, retBookingId]);


  // auth guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const redirect = `/ancillaries?${sp.toString()}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [navigate, sp]);

  // ✅ Block browser back/forward with confirm (SPA safe)
 useEffect(() => {
  if (bookingIds.length === 0) return;

  const marker = { anc: true };
  let leaving = false;

  // Sayfayı "kilitle": back basınca popstate tetiklensin ama biz aynı URL'de kalalım
  window.history.pushState(marker, "", window.location.href);

  const onPopState = async () => {
    // Kullanıcı URL’den çıkmasın diye hemen aynı sayfayı geri it
    window.history.pushState(marker, "", window.location.href);

    if (leaving) return;

    const ok = window.confirm(
      "Are you sure you want to leave?\nYour booking will be cancelled."
    );

    if (!ok) {
      // Hayır -> hiçbir şey yapma. Bir sonraki back'te yine soracak.
      return;
    }

    leaving = true;

    // Cancel
    await Promise.all(
      bookingIds.map((id) =>
        apiVoid(`/api/bookings/${id}/cancel`, { method: "PUT" }).catch(() => {})
      )
    );

    // Artık dinlemeye gerek yok
    window.removeEventListener("popstate", onPopState);

    // ✅ asla history.back() yapma → Google’a atabilir
    const returnUrl = sessionStorage.getItem("anc:returnUrl") || "/";
    navigate(returnUrl, { replace: true });
  };

  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [bookingIds.join(","), navigate]);

  // UI state
  const [activeTab, setActiveTab] = useState<"outbound" | "return">("outbound");
  const [step, setStep] = useState<StepKey>("seat");

  const activeBookingId = useMemo(() => {
    if (!isRoundTrip) return bookingIds[0] ?? null;
    return activeTab === "outbound" ? Number(outBookingId) : Number(retBookingId);
  }, [isRoundTrip, bookingIds, activeTab, outBookingId, retBookingId]);

  // data
  const [bookings, setBookings] = useState<Record<number, BookingResponse>>({});

  const allAncillariesChosen = useMemo(() => {
  if (bookingIds.length === 0) return false;

  return bookingIds.every((id) => {
    const b = bookings[id];

    const seatOk = !!b?.seat?.seatOption?.id;
    const mealOk = !!b?.meal?.mealOption?.id;
    const baggageOk = !!b?.baggage?.baggageOption?.id;

    return seatOk && mealOk && baggageOk;
  });
}, [bookingIds, bookings]);


  const [loadingBookings, setLoadingBookings] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [err, setErr] = useState("");

  const [seatOptions, setSeatOptions] = useState<SeatOption[]>([]);
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [baggageOptions, setBaggageOptions] = useState<BaggageOption[]>([]);

  // seatNumber drafts per booking (optional)
  const [seatNumberDraft, setSeatNumberDraft] = useState<Record<number, string>>({});

  const totalAll = useMemo(() => {
    return bookingIds.reduce((sum, id) => sum + (bookings[id]?.totalPrice ?? 0), 0);
  }, [bookingIds, bookings]);

  async function loadBooking(id: number) {
    const b = await apiJson<BookingResponse>(`/api/bookings/${id}`);
    setBookings((p) => ({ ...p, [id]: b }));
    setSeatNumberDraft((p) => {
      const existing = p[id];
      if (existing !== undefined) return p;
      return { ...p, [id]: b.seat?.seatNumber ?? "" };
    });
  }

  useEffect(() => {
    if (bookingIds.length === 0) {
      setErr("No booking id found.");
      return;
    }

    (async () => {
      setErr("");
      setLoadingBookings(true);
      try {
        await Promise.all(bookingIds.map((id) => loadBooking(id)));
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load booking.");
      } finally {
        setLoadingBookings(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingIds.join(",")]);

  useEffect(() => {
    (async () => {
      setOptionsLoading(true);
      setErr("");
      try {
        const [s, m, b] = await Promise.all([
          apiJson<SeatOption[]>(`/api/seat-options`),
          apiJson<MealOption[]>(`/api/meal-options`),
          apiJson<BaggageOption[]>(`/api/baggage-options`),
        ]);
        setSeatOptions(s);
        setMealOptions(m);
        setBaggageOptions(b);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load options.");
      } finally {
        setOptionsLoading(false);
      }
    })();
  }, []);

  const activeBooking = activeBookingId ? bookings[activeBookingId] : null;

  const outboundBooking = isRoundTrip && outBookingId ? bookings[Number(outBookingId)] : null;
  const returnBooking = isRoundTrip && retBookingId ? bookings[Number(retBookingId)] : null;

  async function chooseMeal(optionId: number) {
    if (!activeBookingId) return;
    try {
      await apiVoid(`/api/bookings/${activeBookingId}/meal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      await loadBooking(activeBookingId);
    } catch (e: any) {
      alert(e?.message ?? "Meal selection failed.");
    }
  }

  async function chooseBaggage(optionId: number) {
    if (!activeBookingId) return;
    try {
      await apiVoid(`/api/bookings/${activeBookingId}/baggage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      await loadBooking(activeBookingId);
    } catch (e: any) {
      alert(e?.message ?? "Baggage selection failed.");
    }
  }

  async function chooseSeat(optionId: number) {
    if (!activeBookingId) return;

    const raw = seatNumberDraft[activeBookingId] ?? "";
    const seatNumber = raw.trim() ? raw.trim() : null;

    try {
      await apiVoid(`/api/bookings/${activeBookingId}/seat`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, seatNumber }),
      });
      await loadBooking(activeBookingId);
    } catch (e: any) {
      alert(e?.message ?? "Seat selection failed.");
    }
  }

  const stepTitle = useMemo(() => {
    if (step === "seat") return "Seat Selection";
    if (step === "meal") return "Meal Selection";
    return "Baggage Selection";
  }, [step]);

  const stepHint = useMemo(() => {
    return "Your total price updates automatically after each selection.";
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        backgroundImage: `url(${BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen bg-black/30">
        <AppTopBar />

        {/* wider container */}
        <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-10">
          {/* TOP SUMMARY BAR */}
          <div className="rounded-[30px] border border-white/10 bg-white/10 p-7 text-white backdrop-blur-2xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-semibold tracking-widest text-white/70">
                  CUSTOMIZE YOUR FLIGHT
                </div>

                <div className="mt-2 text-2xl font-extrabold">
                  {flightFromLabel(activeBooking?.flight)}{" "}
                  <span className="text-white/70">→</span>{" "}
                  {flightToLabel(activeBooking?.flight)}
                </div>

                <div className="mt-1 text-sm text-white/85">
                  {isRoundTrip ? (
                    <>
                      Outbound:{" "}
                      <span className="font-semibold">
                        {outboundBooking?.flight?.departureTime
                          ? fmtDateTime(outboundBooking.flight.departureTime)
                          : "—"}
                      </span>
                      {" · "}
                      Return:{" "}
                      <span className="font-semibold">
                        {returnBooking?.flight?.departureTime
                          ? fmtDateTime(returnBooking.flight.departureTime)
                          : "—"}
                      </span>
                    </>
                  ) : (
                    <>
                      Outbound:{" "}
                      <span className="font-semibold">
                        {activeBooking?.flight?.departureTime
                          ? fmtDateTime(activeBooking.flight.departureTime)
                          : "—"}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/85">
                    Fare: {fareNameLabel(activeBooking?.airlineFareType)}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/85">
                    Included baggage: {includedBaggageLabel(activeBooking?.airlineFareType)}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/85">
                    Status: {activeBooking?.status ?? "—"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="text-xs text-white/70">Total</div>
                <div className="text-4xl font-extrabold">{moneyTRY(totalAll)}</div>

                <div className="mt-2 flex gap-2">
                  <button
                    disabled
                    className="cursor-not-allowed rounded-full bg-orange-600/40 px-4 py-2 text-sm font-semibold text-white/70"
                    title="Payment page will be implemented next."
                  >
                    Payment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GRID (bigger sidebar) */}
          <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT STEPPER */}
<div className="lg:col-span-3">
  <div className="sticky top-24">
    <div className="relative rounded-[30px] border border-white/20 bg-gradient-to-b from-slate-900/55 to-slate-900/35 p-6 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      {/* subtle ring to make it crisp */}
      <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-white/10" />

      <div className="relative">
        <div className="text-sm font-extrabold tracking-wide text-white/95">Steps</div>

        <div className="mt-4 space-y-3 text-sm">
          <StepLine label="Flight selection" state="done" />
          <StepLine label="Fare selection" state="done" />
          <StepLine label="Ancillaries" state="active" />
          <StepLine label="Payment" state="todo" />
        </div>

        <div className="mt-5 h-px bg-white/15" />

        <div className="mt-4 text-xs font-extrabold tracking-widest text-white/70">
          ANCILLARIES
        </div>

        <div className="mt-3 space-y-2">
          <SideBtn active={step === "seat"} onClick={() => setStep("seat")}>
            Seat selection
          </SideBtn>

          <SideBtn active={step === "meal"} onClick={() => setStep("meal")}>
            Meal selection
          </SideBtn>

          <SideBtn active={step === "baggage"} onClick={() => setStep("baggage")}>
            Baggage selection
          </SideBtn>
        </div>
      </div>
    </div>
  </div>
</div>


            {/* RIGHT CONTENT */}
            <div className="lg:col-span-8">
              <div className="rounded-[30px] bg-white p-8 shadow-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-3xl font-extrabold text-slate-900">{stepTitle}</div>
                    <div className="mt-1 text-sm text-slate-500">{stepHint}</div>
                  </div>

                  {isRoundTrip && (
                    <div className="flex rounded-2xl bg-slate-100 p-1">
                      <TabBtn active={activeTab === "outbound"} onClick={() => setActiveTab("outbound")}>
                        Outbound
                      </TabBtn>
                      <TabBtn active={activeTab === "return"} onClick={() => setActiveTab("return")}>
                        Return
                      </TabBtn>
                    </div>
                  )}
                </div>

                {(loadingBookings || optionsLoading) && (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Loading...
                  </div>
                )}

                {!!err && !loadingBookings && (
                  <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{err}</div>
                )}

                {!loadingBookings && activeBooking && (
                  <div className="mt-7">
                    {/* Active booking mini header */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {airlineLabel(activeBooking.flight)} · {activeBooking.flight.flightNumber}
                        </div>
                        <div className="text-base font-extrabold text-emerald-700">
                          {moneyTRY(activeBooking.totalPrice)}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-600">
                        {flightFromLabel(activeBooking.flight)} → {flightToLabel(activeBooking.flight)} ·{" "}
                        {fmtDateTime(activeBooking.flight.departureTime)}
                      </div>
                    </div>

                    {/* Step content */}
                    {step === "seat" && (
                      <div className="mt-7">
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm font-semibold text-slate-900">
                            Choose a seat type + (optional) seat number
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-500">Seat No (optional)</div>
                            <input
                              value={seatNumberDraft[activeBooking.id] ?? ""}
                              onChange={(e) =>
                                setSeatNumberDraft((p) => ({ ...p, [activeBooking.id]: e.target.value }))
                              }
                              placeholder="12A (optional)"
                              className="w-44 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                          </div>
                        </div>

                        <OptionGrid>
                          {seatOptions.map((o) => {
                            const activeId = activeBooking.seat?.seatOption?.id;
                            const active = activeId === o.id;
                            return (
                              <OptionCard
                                key={o.id}
                                title={seatTypeLabel(o)}
                                subtitle="Seat option"
                                price={o.price}
                                active={active}
                                onClick={() => chooseSeat(o.id)}
                              />
                            );
                          })}
                        </OptionGrid>

                        <div className="mt-3 text-xs text-slate-500">
                          Selected:{" "}
                          <span className="font-semibold">
                            {activeBooking.seat?.seatOption ? seatTypeLabel(activeBooking.seat.seatOption) : "—"}
                          </span>
                          {activeBooking.seat?.seatNumber ? (
                            <>
                              {" "}
                              · Seat No: <span className="font-semibold">{activeBooking.seat.seatNumber}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {step === "meal" && (
                      <div className="mt-7">
                        <OptionGrid>
                          {mealOptions.map((o) => {
                            const activeId = activeBooking.meal?.mealOption?.id;
                            const active = activeId === o.id;
                            return (
                              <OptionCard
                                key={o.id}
                                title={o.name}
                                subtitle="Meal option"
                                price={o.price}
                                active={active}
                                onClick={() => chooseMeal(o.id)}
                              />
                            );
                          })}
                        </OptionGrid>

                        <div className="mt-3 text-xs text-slate-500">
                          Selected:{" "}
                          <span className="font-semibold">{activeBooking.meal?.mealOption?.name ?? "—"}</span>
                        </div>
                      </div>
                    )}

                    {step === "baggage" && (
                      <div className="mt-7">
                        <OptionGrid>
                          {baggageOptions.map((o) => {
                            const activeId = activeBooking.baggage?.baggageOption?.id;
                            const active = activeId === o.id;
                            return (
                              <OptionCard
                                key={o.id}
                                title={baggageKgLabel(o)}
                                subtitle="Extra baggage"
                                price={o.price}
                                active={active}
                                onClick={() => chooseBaggage(o.id)}
                              />
                            );
                          })}
                        </OptionGrid>

                        <div className="mt-3 text-xs text-slate-500">
                          Selected:{" "}
                          <span className="font-semibold">
                            {activeBooking.baggage?.baggageOption ? baggageKgLabel(activeBooking.baggage.baggageOption) : "—"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom nav */}
                    <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          const order: StepKey[] = ["seat", "meal", "baggage"];
                          const idx = order.indexOf(step);
                          if (idx > 0) setStep(order[idx - 1]);
                        }}
                        className="rounded-2xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Back
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const order: StepKey[] = ["seat", "meal", "baggage"];
                            const idx = order.indexOf(step);
                            if (idx < order.length - 1) setStep(order[idx + 1]);
                          }}
                          className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Next
                        </button>

                        <button
                          onClick={() => {
    if (bookingId) navigate(`/payment?bookingId=${bookingId}`);
    else navigate(`/payment?outBookingId=${outBookingId}&retBookingId=${retBookingId}`);
  }}
  disabled={!allAncillariesChosen}
  className={
    !allAncillariesChosen
      ? "cursor-not-allowed rounded-2xl bg-orange-600/40 px-6 py-3 text-sm font-semibold text-white/70"
      : "rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700"
  }
  
>
  Proceed to payment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!loadingBookings && !activeBooking && (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Booking not found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function StepLine({ label, state }: { label: string; state: "done" | "active" | "todo" }) {
  const dotCls =
    state === "done"
      ? "bg-emerald-400/90 ring-emerald-300/40"
      : state === "active"
      ? "bg-orange-400/90 ring-orange-300/40"
      : "bg-white/25 ring-white/15";

  const textCls =
    state === "active" ? "text-white font-semibold" : state === "done" ? "text-white/85" : "text-white/60";

  const right =
    state === "done" ? (
      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-200">DONE</span>
    ) : state === "active" ? (
      <span className="rounded-full bg-orange-500/15 px-2 py-1 text-[10px] font-bold text-orange-200">NOW</span>
    ) : null;

  return (
    <div className={`flex items-center justify-between gap-3 ${textCls}`}>
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ring-4 ${dotCls}`} />
        <span className="text-sm">{label}</span>
      </div>
      {right}
    </div>
  );
}

function SideBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-5 py-4 text-left text-sm font-semibold transition ${
        active ? "bg-white text-slate-900 shadow" : "bg-white/10 text-white/85 hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
        active ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>;
}

function OptionCard({
  title,
  subtitle,
  price,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  price: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active ? "border-orange-500 bg-orange-50 shadow" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="text-base font-extrabold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      <div className="mt-3 text-base font-extrabold text-emerald-700">{moneyTRY(price)}</div>
    </button>
  );
}
