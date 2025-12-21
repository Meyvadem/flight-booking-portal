import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import { apiJson } from "../api";
import { useLocation } from "react-router-dom";

type FlightSearchResponse = {
  flightId: number;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  from: string;
  to: string;
  departureTime: string; // ISO
  arrivalTime: string; // ISO
  basePrice: number;
};

type RoundTripFlightResponse = {
  outboundFlights: FlightSearchResponse[];
  returnFlights: FlightSearchResponse[];
};

type FareOptionResponse = {
  airlineFareTypeId: number;
  fareType: string;
  includedBaggageKg: number;
  extraPrice: number;
  totalPrice: number;
};

type PersistPayload = {
  selectedOutboundId: number | null;
  selectedReturnId: number | null;
  chosenFareIds: Record<number, number | null>; // flightId -> airlineFareTypeId
};

const BG =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=80";

const PENDING_CONTINUE_KEY = "pendingContinueKey";

function fmtDateShort(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  const wk = d.toLocaleString("en-US", { weekday: "short" });
  return `${day} ${mon} (${wk})`;
}

function fmtTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function durationMinutes(dep: string, arr: string) {
  const a = new Date(dep).getTime();
  const b = new Date(arr).getTime();
  return Math.max(0, Math.round((b - a) / 60000));
}

function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function moneyTRY(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(n);
}

export default function Results() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const location = useLocation();

useEffect(() => {
  sessionStorage.setItem("lastResultsUrl", location.pathname + location.search);
}, [location.pathname, location.search]);

  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const departureDate = sp.get("departureDate") ?? "";
  const returnDate = sp.get("returnDate") ?? "";
  const isRoundTrip = !!returnDate;

  // ✅ persist key (aynı arama için)
  const storageKey = useMemo(() => {
    return `resultsState:${from}:${to}:${departureDate}:${returnDate || "ONE_WAY"}`;
  }, [from, to, departureDate, returnDate]);

  const [data, setData] = useState<RoundTripFlightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [selectedOutboundId, setSelectedOutboundId] = useState<number | null>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);

  const [fareCache, setFareCache] = useState<Record<number, FareOptionResponse[]>>({});
  const [fareLoadingId, setFareLoadingId] = useState<number | null>(null);

  const [chosenFare, setChosenFare] = useState<Record<number, FareOptionResponse | null>>({});

  const [sortKey, setSortKey] = useState<"price" | "time">("price");

  // ✅ ensure fare options (return options)
  async function ensureFareOptions(
  flightId: number,
  force = false
): Promise<FareOptionResponse[]> {
  if (!force && fareCache[flightId] !== undefined) return fareCache[flightId] ?? [];

  setFareLoadingId(flightId);
  try {
    const options = await apiJson<FareOptionResponse[]>(
      `/api/flights/${flightId}/fare-options`
    );

    setFareCache((p) => ({ ...p, [flightId]: options }));
    return options;
  } finally {
    setFareLoadingId(null);
  }
}

  // ✅ seçim değişince kaydet (daha sağlam: fareId sakla)
  useEffect(() => {
    if (!from || !to || !departureDate) return;

    const chosenFareIds: Record<number, number | null> = {};
    for (const [k, v] of Object.entries(chosenFare)) {
      const fid = Number(k);
      chosenFareIds[fid] = v?.airlineFareTypeId ?? null;
    }

    const payload: PersistPayload = {
      selectedOutboundId,
      selectedReturnId,
      chosenFareIds,
    };

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // sessizce geç
    }
  }, [storageKey, from, to, departureDate, selectedOutboundId, selectedReturnId, chosenFare]);

  // ✅ search
  useEffect(() => {
    if (!from || !to || !departureDate) {
      setErr("Missing search params.");
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const qs = new URLSearchParams();
qs.set("from", from);
qs.set("to", to);
qs.set("departureDate", departureDate);
if (returnDate) qs.set("returnDate", returnDate);

const json = await apiJson<RoundTripFlightResponse>(
  `/api/flights/search?${qs.toString()}`
);

setData(json);

        // ✅ RESTORE (data geldikten sonra)
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) {
          setSelectedOutboundId(null);
          setSelectedReturnId(null);
          setChosenFare({});
          return;
        }

        let saved: PersistPayload | null = null;
        try {
          saved = JSON.parse(raw) as PersistPayload;
        } catch {
          saved = null;
        }

        if (!saved) {
          setSelectedOutboundId(null);
          setSelectedReturnId(null);
          setChosenFare({});
          return;
        }

        const allIds = new Set<number>([
          ...(json.outboundFlights ?? []).map((f) => f.flightId),
          ...(json.returnFlights ?? []).map((f) => f.flightId),
        ]);

        const outId =
          saved.selectedOutboundId && allIds.has(saved.selectedOutboundId)
            ? saved.selectedOutboundId
            : null;

        const retId =
          saved.selectedReturnId && allIds.has(saved.selectedReturnId)
            ? saved.selectedReturnId
            : null;

        setSelectedOutboundId(outId);
        setSelectedReturnId(isRoundTrip ? retId : null);

        // chosenFare restore: fareId ile tekrar eşle
        const nextChosen: Record<number, FareOptionResponse | null> = {};

        if (outId) {
          const opts = await ensureFareOptions(outId, true);
          const aftId = saved.chosenFareIds?.[outId] ?? null;
          nextChosen[outId] = aftId ? opts.find((o) => o.airlineFareTypeId === aftId) ?? null : null;
        }

        if (isRoundTrip && retId) {
          const opts = await ensureFareOptions(retId, true);
          const aftId = saved.chosenFareIds?.[retId] ?? null;
          nextChosen[retId] = aftId ? opts.find((o) => o.airlineFareTypeId === aftId) ?? null : null;
        }

        setChosenFare(nextChosen);
      } catch (e: any) {
        setErr(e?.message ?? "Search failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, departureDate, returnDate, storageKey, isRoundTrip]);

  const outboundSorted = useMemo(() => {
    const list = data?.outboundFlights ?? [];
    const copy = [...list];

    if (sortKey === "price") {
      copy.sort((a, b) => {
        const aPrice = chosenFare[a.flightId]?.totalPrice ?? a.basePrice;
        const bPrice = chosenFare[b.flightId]?.totalPrice ?? b.basePrice;
        return aPrice - bPrice;
      });
    } else {
      copy.sort(
        (a, b) =>
          new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
    }
    return copy;
  }, [data, sortKey, chosenFare]);

  const returnSorted = useMemo(() => {
    const list = data?.returnFlights ?? [];
    const copy = [...list];

    if (sortKey === "price") {
      copy.sort((a, b) => {
        const aPrice = chosenFare[a.flightId]?.totalPrice ?? a.basePrice;
        const bPrice = chosenFare[b.flightId]?.totalPrice ?? b.basePrice;
        return aPrice - bPrice;
      });
    } else {
      copy.sort(
        (a, b) =>
          new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
    }
    return copy;
  }, [data, sortKey, chosenFare]);

  function selectFlight(which: "outbound" | "return", flight: FlightSearchResponse) {
    if (which === "outbound") {
      setSelectedOutboundId(flight.flightId);
      if (isRoundTrip) {
        setSelectedReturnId(null);
      }

      // outbound değişince return fare seçimlerini de temizle
      if (isRoundTrip) {
        setChosenFare((p) => {
          const next = { ...p };
          if (selectedReturnId) delete next[selectedReturnId];
          return next;
        });
      }
    } else {
      setSelectedReturnId(flight.flightId);
    }

    ensureFareOptions(flight.flightId, true);
  }

  const canContinue = useMemo(() => {
    if (!selectedOutboundId) return false;
    if (!chosenFare[selectedOutboundId]) return false;

    if (isRoundTrip) {
      if (!selectedReturnId) return false;
      if (!chosenFare[selectedReturnId]) return false;
    }
    return true;
  }, [selectedOutboundId, selectedReturnId, chosenFare, isRoundTrip]);

  async function handleContinue() {
    sessionStorage.setItem("anc:returnUrl", `/results?${sp.toString()}`);

    const token = localStorage.getItem("token");

    // ✅ token yoksa login'e (redirect + pendingContinue)
    if (!token) {
      sessionStorage.setItem(PENDING_CONTINUE_KEY, storageKey);

      const redirect = `/results?${sp.toString()}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    if (!selectedOutboundId) return;
    const outFare = chosenFare[selectedOutboundId];
    if (!outFare) return;

    async function createBooking(flightId: number, airlineFareTypeId: number) {
  return await apiJson<{ id: number }>(`/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flightId, airlineFareTypeId }),
  });
}

    try {
      const outBooking = await createBooking(selectedOutboundId, outFare.airlineFareTypeId);

      if (!isRoundTrip) {
        navigate(`/ancillaries?bookingId=${outBooking.id}`);
        return;
      }

      if (!selectedReturnId) return;
      const retFare = chosenFare[selectedReturnId];
      if (!retFare) return;

      const retBooking = await createBooking(selectedReturnId, retFare.airlineFareTypeId);

      navigate(`/ancillaries?outBookingId=${outBooking.id}&retBookingId=${retBooking.id}`);
    } catch (e: any) {
      alert(e?.message ?? "Booking failed.");
    }
  }


  useEffect(() => {
  // Login'den döndükten sonra otomatik işlem yok, sadece flag temizliği
  const token = localStorage.getItem("token");
  if (!token) return;

  const pendingKey = sessionStorage.getItem(PENDING_CONTINUE_KEY);
  if (pendingKey === storageKey) {
    sessionStorage.removeItem(PENDING_CONTINUE_KEY);
  }
}, [storageKey]);


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
      <div className="min-h-screen bg-black/35">
        {/* ✅ TOP BAR */}
        <AppTopBar />

        {/* HEADER BLOCK */}
        <div className="mx-auto max-w-7xl px-6 pt-10">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-7 backdrop-blur-2xl">
            {/* ✅ Back + Sort şeffaf alanın içinde */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold tracking-widest text-white/70">
                  FLIGHT RESULTS
                </div>

                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <div className="rounded-xl bg-white/15 px-4 py-2 text-2xl font-extrabold text-white">
                    {from || "—"}
                  </div>
                  <div className="text-white/80">→</div>
                  <div className="rounded-xl bg-white/15 px-4 py-2 text-2xl font-extrabold text-white">
                    {to || "—"}
                  </div>
                </div>

                <div className="mt-2 text-sm text-white/85">
                  Depart {departureDate ? fmtDateShort(departureDate) : "—"}
                  {isRoundTrip ? ` · Return ${fmtDateShort(returnDate)}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="rounded-full bg-white/15 px-5 py-2.5 text-sm text-white hover:bg-white/20"
                >
                  Back to Search
                </button>

                <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white">
                  <span className="opacity-80">Sort</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as any)}
                    className="bg-transparent outline-none"
                  >
                    <option value="price">Price</option>
                    <option value="time">Departure time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* mini info */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-2xl bg-white/10 px-5 py-3 text-sm text-white/85">
                {from} → {to} · {fmtDateShort(departureDate)}
                {isRoundTrip ? ` · ${fmtDateShort(returnDate)}` : ""}
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white/85">
                  Direct only
                </div>
                <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white/85">
                  No stops
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
          {loading && (
            <div className="rounded-3xl bg-white/10 p-6 text-white/90 backdrop-blur">
              Loading flights...
            </div>
          )}

          {!!err && !loading && (
            <div className="rounded-3xl bg-red-500/15 p-6 text-white backdrop-blur">
              {err}
            </div>
          )}

          {!loading && !err && data && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <Section title="Outbound" subtitle={`${from} → ${to}`} count={outboundSorted.length}>
                  {outboundSorted.map((f) => (
                    <FlightCard
                      key={f.flightId}
                      flight={f}
                      isSelected={selectedOutboundId === f.flightId}
                      selectedFare={chosenFare[f.flightId]}
                      fareOptions={fareCache[f.flightId]}
                      fareLoading={fareLoadingId === f.flightId}
                      onSelect={() => selectFlight("outbound", f)}
                      onChooseFare={(opt) => setChosenFare((p) => ({ ...p, [f.flightId]: opt }))}
                      disabled={false}
                    />
                  ))}
                </Section>

                {isRoundTrip && (
                  <div className="mt-6">
                    <Section title="Return" subtitle={`${to} → ${from}`} count={returnSorted.length}>
                      {!selectedOutboundId ? (
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-white/85 backdrop-blur">
                          Select an outbound flight first.
                        </div>
                      ) : returnSorted.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-white/85 backdrop-blur">
                          No return flights found.
                        </div>
                      ) : (
                        returnSorted.map((f) => (
                          <FlightCard
                            key={f.flightId}
                            flight={f}
                            isSelected={selectedReturnId === f.flightId}
                            selectedFare={chosenFare[f.flightId]}
                            fareOptions={fareCache[f.flightId]}
                            fareLoading={fareLoadingId === f.flightId}
                            onSelect={() => selectFlight("return", f)}
                            onChooseFare={(opt) => setChosenFare((p) => ({ ...p, [f.flightId]: opt }))}
                            disabled={!selectedOutboundId}
                          />
                        ))
                      )}
                    </Section>
                  </div>
                )}
              </div>

              {/* SUMMARY */}
              <div className="lg:col-span-4">
                <div className="sticky top-24 rounded-[28px] border border-white/10 bg-white/10 p-6 text-white backdrop-blur-2xl">
                  <div className="text-sm font-semibold text-white/80">Summary</div>

                  <div className="mt-4 space-y-3 text-sm text-white/85">
                    <div>
                      <span className="text-white/60">Route:</span>{" "}
                      <span className="font-semibold">
                        {from} → {to}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Depart:</span>{" "}
                      <span className="font-semibold">{departureDate}</span>
                    </div>
                    {isRoundTrip && (
                      <div>
                        <span className="text-white/60">Return:</span>{" "}
                        <span className="font-semibold">{returnDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 h-px bg-white/10" />

                  <div className="mt-5 space-y-2 text-sm">
                    <PriceLine
                      label="Outbound"
                      value={
                        selectedOutboundId
                          ? moneyTRY(chosenFare[selectedOutboundId!]?.totalPrice ?? 0)
                          : "—"
                      }
                    />
                    {isRoundTrip && (
                      <PriceLine
                        label="Return"
                        value={
                          selectedReturnId
                            ? moneyTRY(chosenFare[selectedReturnId!]?.totalPrice ?? 0)
                            : "—"
                        }
                      />
                    )}

                    <div className="mt-3 h-px bg-white/10" />

                    <PriceLine
                      label="Total"
                      value={moneyTRY(
                        (selectedOutboundId ? chosenFare[selectedOutboundId]?.totalPrice ?? 0 : 0) +
                          (isRoundTrip && selectedReturnId
                            ? chosenFare[selectedReturnId]?.totalPrice ?? 0
                            : 0)
                      )}
                      strong
                    />
                  </div>

                  <button
                    onClick={handleContinue}
                    disabled={!canContinue}
                    className={`mt-6 w-full rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg ${
                      canContinue
                        ? "bg-orange-600 text-white hover:bg-orange-700"
                        : "cursor-not-allowed bg-orange-600/40 text-white/70"
                    }`}
                  >
                    Continue
                  </button>

                  <div className="mt-3 text-xs text-white/60">
                    Continue requires login (booking is protected).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- UI pieces ---------- */

function Section({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] bg-white/95 p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <div className="text-sm text-slate-500">{subtitle}</div>
        </div>
        <div className="text-sm text-slate-500">{count} flight(s)</div>
      </div>

      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function FlightCard({
  flight,
  isSelected,
  selectedFare,
  fareOptions,
  fareLoading,
  onSelect,
  onChooseFare,
  disabled,
}: {
  flight: FlightSearchResponse;
  isSelected: boolean;
  selectedFare: FareOptionResponse | null | undefined;
  fareOptions: FareOptionResponse[] | undefined;
  fareLoading: boolean;
  onSelect: () => void;
  onChooseFare: (opt: FareOptionResponse) => void;
  disabled: boolean;
}) {
  const mins = durationMinutes(flight.departureTime, flight.arrivalTime);
  const shownPrice = selectedFare?.totalPrice ?? flight.basePrice;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-extrabold text-slate-700">
            {flight.airlineCode}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {flight.airlineName} ({flight.airlineCode}) · {flight.flightNumber}
            </div>
            <div className="text-xs text-slate-500">Direct flight</div>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-6 text-center md:w-[420px]">
          <div>
            <div className="text-xs text-slate-500">{flight.from}</div>
            <div className="text-lg font-extrabold text-slate-900">{fmtTime(flight.departureTime)}</div>
            <div className="text-xs text-slate-500">
              {new Date(flight.departureTime).toLocaleDateString("en-GB")}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            <div className="mb-2">{fmtDuration(mins)}</div>
            <div className="h-px w-full bg-slate-200" />
            <div className="mt-2">Direct</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">{flight.to}</div>
            <div className="text-lg font-extrabold text-slate-900">{fmtTime(flight.arrivalTime)}</div>
            <div className="text-xs text-slate-500">
              {new Date(flight.arrivalTime).toLocaleDateString("en-GB")}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
          <div className="text-right">
            <div className="text-xs text-slate-500">Price</div>
            <div className="text-lg font-extrabold text-emerald-700">{moneyTRY(shownPrice)}</div>
          </div>

          <button
            onClick={onSelect}
            disabled={disabled}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold ${
              disabled
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : isSelected
                ? "bg-slate-900 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {disabled ? "Select outbound first" : isSelected ? "Selected" : "Select Flight"}
          </button>
        </div>
      </div>

      {isSelected && !disabled && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Fare options</div>

          {fareLoading && <div className="mt-3 text-sm text-slate-600">Loading fare options...</div>}

          {!fareLoading && (!fareOptions || fareOptions.length === 0) && (
            <div className="mt-3 text-sm text-slate-600">No fare options.</div>
          )}

          {!fareLoading && fareOptions && fareOptions.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {fareOptions.map((o) => {
                const active = selectedFare?.airlineFareTypeId === o.airlineFareTypeId;
                return (
                  <button
                    key={o.airlineFareTypeId}
                    type="button"
                    onClick={() => onChooseFare(o)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-orange-500 bg-white shadow"
                        : "border-orange-200 bg-white hover:border-orange-400"
                    }`}
                  >
                    <div className="text-sm font-extrabold text-slate-900">{o.fareType}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Baggage: {o.includedBaggageKg} kg
                    </div>
                    <div className="mt-3 text-sm font-extrabold text-emerald-700">
                      {moneyTRY(o.totalPrice)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">+{moneyTRY(o.extraPrice)} extra</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PriceLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className={strong ? "text-sm font-semibold text-white" : "text-sm text-white/80"}>
        {label}
      </div>
      <div className={strong ? "text-sm font-extrabold text-white" : "text-sm text-white/90"}>
        {value}
      </div>
    </div>
  );
}
