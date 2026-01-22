import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import AppTopBar from "../components/AppTopBar";
import { apiJson } from "../api";


type TripType = "ONE_WAY" | "ROUND_TRIP";

type Airport = {
  id: number;
  city: string;
  code: string;
  country: string;
  name: string;
};

const HERO_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=80",
];

const FROM_ENDPOINT = "/api/airports/from";
const TO_ENDPOINT = (fromId: number) => `/api/airports/to?fromId=${fromId}`;

const AIRLINE_CHIPS = [
  "Turkish Airlines",
  "Pegasus",
  "SunExpress",
  "AJet",
  "Emirates",
  "Qatar",
  "Lufthansa",
];

function AirportPicker({
  label,
  options,
  selected,
  onSelect,
  disabled,
  placeholder,
}: {
  label: string;
  options: Airport[];
  selected: Airport | null;
  onSelect: (a: Airport) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selected) setQuery(selected.code);
    else setQuery("");
  }, [selected]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const base = options ?? [];
    const qRaw = query.trim();
    const selectedCode = selected?.code ?? "";

    const shouldShowAll =
      open && selectedCode && qRaw.toUpperCase() === selectedCode.toUpperCase();

    const q = shouldShowAll ? "" : qRaw.toLowerCase();
    if (!q) return base.slice(0, 10);

    return base
      .filter((a) => {
        const hay = `${a.code} ${a.city} ${a.name} ${a.country}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 10);
  }, [options, query, open, selected]);

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-2 block text-sm text-white/90">{label}</label>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-3xl border px-6 py-4 text-base outline-none ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-white/30 text-slate-500"
            : "border-white/20 bg-white/82 text-slate-900 focus:border-white"
        }`}
      />

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-600">No matches</div>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(a);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {a.code}{" "}
                  <span className="font-normal text-slate-700">{a.city}</span>
                </div>
                <div className="text-xs text-slate-500">{a.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<TripType>("ROUND_TRIP");
  const isOneWay = tripType === "ONE_WAY";

  const today = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  const [departDate, setDepartDate] = useState(today);
  const [returnDate, setReturnDate] = useState(today);

  const [fromOptions, setFromOptions] = useState<Airport[]>([]);
  const [toOptions, setToOptions] = useState<Airport[]>([]);
  const [loadingFrom, setLoadingFrom] = useState(false);
  const [loadingTo, setLoadingTo] = useState(false);

  const [fromSelected, setFromSelected] = useState<Airport | null>(null);
  const [toSelected, setToSelected] = useState<Airport | null>(null);

  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIdx((x) => (x + 1) % HERO_IMAGES.length);
    }, 9500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
  (async () => {
    setLoadingFrom(true);
    try {
      const data = await apiJson<Airport[]>(FROM_ENDPOINT);
      setFromOptions(data);
      if (data.length > 0) setFromSelected(data[0]);
    } finally {
      setLoadingFrom(false);
    }
  })();
}, []);

  useEffect(() => {
  if (!fromSelected) return;

  (async () => {
    setLoadingTo(true);
    try {
      const data = await apiJson<Airport[]>(TO_ENDPOINT(fromSelected.id));
      setToOptions(data);
      setToSelected(null);
    } finally {
      setLoadingTo(false);
    }
  })();
}, [fromSelected?.id])

  const canSearch = !!fromSelected && !!toSelected && !loadingTo;

  function handleSearch() {
    if (!fromSelected || !toSelected) return;

    const params = new URLSearchParams();
    params.set("from", fromSelected.code);
    params.set("to", toSelected.code);
    params.set("departureDate", departDate);

    if (!isOneWay) {
      params.set("returnDate", returnDate);
    }

    navigate(`/results?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      {/* dropdown kesilmesin diye: dış container overflow-visible */}
      <div className="relative h-[860px] w-full overflow-visible">
        {/* background sadece burada kesilsin */}
        <div className="absolute inset-0 overflow-hidden">
          {HERO_IMAGES.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                i === heroIdx ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-black/25" />

        {/* TOP BAR ortak */}
        <div className="fixed top-0 left-0 right-0 z-20">
          <AppTopBar />
        </div>

        {/* SEARCH AREA */}
        <div className="relative z-10 flex h-full items-start justify-center">
          <div className="w-full">
            <div className="mx-auto mt-[330px] max-w-7xl px-6">
              {/* tabs */}
              <div className="mb-6 flex justify-center">
                <div className="flex rounded-full bg-white/25 p-1.5 backdrop-blur">
                  <button
                    onClick={() => {
                      setTripType("ONE_WAY");
                      setReturnDate(departDate);
                    }}
                    className={`rounded-full px-7 py-3 text-base font-semibold transition ${
                      tripType === "ONE_WAY"
                        ? "bg-white text-slate-900"
                        : "text-white/90 hover:text-white"
                    }`}
                  >
                    One Way
                  </button>
                  <button
                    onClick={() => setTripType("ROUND_TRIP")}
                    className={`rounded-full px-7 py-3 text-base font-semibold transition ${
                      tripType === "ROUND_TRIP"
                        ? "bg-orange-600 text-white"
                        : "text-white/90 hover:text-white"
                    }`}
                  >
                    Round Trip
                  </button>
                </div>
              </div>

              {/* panel */}
              <div className="rounded-[44px] bg-white/10 p-10 shadow-2xl backdrop-blur-3xl">
                <div className="grid grid-cols-12 gap-6 items-stretch">
                  <div className="col-span-12 md:col-span-3">
                    <AirportPicker
                      label={loadingFrom ? "From (loading...)" : "From"}
                      options={fromOptions}
                      selected={fromSelected}
                      onSelect={(a) => setFromSelected(a)}
                      disabled={loadingFrom}
                      placeholder="Select departure"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <AirportPicker
                      label={loadingTo ? "To (loading...)" : "To"}
                      options={toOptions}
                      selected={toSelected}
                      onSelect={(a) => setToSelected(a)}
                      disabled={!fromSelected || loadingTo}
                      placeholder={!fromSelected ? "Select From first" : "Select destination"}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <label className="mb-2 block text-sm text-white/90">Depart</label>
                    <input
                      type="date"
                      value={departDate}
                      onChange={(e) => {
                        setDepartDate(e.target.value);
                        if (isOneWay) setReturnDate(e.target.value);
                      }}
                      min={today}
                      className="w-full rounded-3xl border border-white/20 bg-white/82 px-6 py-4 text-base text-slate-900 outline-none focus:border-white"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <label className="mb-2 block text-sm text-white/90">Return</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={departDate}
                      disabled={isOneWay}
                      className={`w-full rounded-3xl border px-6 py-4 text-base outline-none ${
                        isOneWay
                          ? "cursor-not-allowed border-white/10 bg-white/30 text-slate-500"
                          : "border-white/20 bg-white/82 text-slate-900 focus:border-white"
                      }`}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-2 flex">
                    <button
                      onClick={handleSearch}
                      disabled={!canSearch}
                      className={`w-full rounded-3xl px-7 text-base font-semibold shadow-lg h-[56px] self-end ${
                        canSearch
                          ? "bg-orange-600 text-white hover:bg-orange-700"
                          : "cursor-not-allowed bg-orange-600/40 text-white/70"
                      }`}
                    >
                      Search Flights
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-7 text-center text-white/85 text-base">
                FlyAway — fast flight search & booking
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AIRLINES */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-center gap-3 opacity-90">
            {AIRLINE_CHIPS.map((a) => (
              <div
                key={a}
                className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm"
              >
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-center text-3xl font-semibold">Recommended Destinations</h2>
        <p className="mt-2 text-center text-slate-500">Later we’ll fetch these dynamically.</p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          {["London", "Edinburgh", "Paris", "Coastline"].map((t) => (
            <div key={t} className="h-44 rounded-3xl bg-white shadow" />
          ))}
        </div>
      </div>
    </div>
  );
}
