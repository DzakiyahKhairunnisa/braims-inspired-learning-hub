import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Activity, Radio, BrainCircuit, CloudRain, Sun, Sprout, ShieldCheck, FileBarChart, Settings,
  Waves, Download, Search, Menu, ClipboardList,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { ReservoirGauge } from "@/components/ReservoirGauge";
import { OperatorCenter } from "@/components/dashboard/OperatorCenter";
import { NotificationBell } from "@/components/dashboard/NotificationPanel";
import { LEVELS, STORAGE } from "@/lib/dam-data";
import { DEFAULT_DAM_CONFIG } from "@/lib/dam-config";
import { changeSimulationScenario, fmtTime, useTelemetry } from "@/lib/telemetry";
import { SIM_SCENARIOS } from "@/lib/simulation-scenarios";
import { ML_DEMO_LABEL } from "@/lib/ml-engine";
import { statusBadgeClass } from "@/lib/rule-engine";
import { useDamSystem, useOperatorStore } from "@/hooks/useDamSystem";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Sengkaling Dam Intelligence" },
      { name: "description", content: "Dashboard operasi Bendungan Sengkaling: muka air, debit, curah hujan, sensor ADAS, FEWS, DEWS, dan irigasi." },
      { property: "og:title", content: "Operations Dashboard — Sengkaling Dam Intelligence" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const NAV = [
  { k: "overview", l: "Overview", i: LayoutDashboard },
  { k: "live", l: "Live Monitoring", i: Activity },
  { k: "sensors", l: "Sensor & IoT", i: Radio },
  { k: "ml", l: "ML Prediction", i: BrainCircuit },
  { k: "fews", l: "FEWS", i: CloudRain },
  { k: "dews", l: "DEWS", i: Sun },
  { k: "operator", l: "Operator Center", i: ClipboardList },
  { k: "irrigation", l: "Distribusi Air", i: Sprout },
  { k: "safety", l: "Dam Safety / RTD", i: ShieldCheck },
  { k: "reports", l: "Histori & Audit", i: FileBarChart },
  { k: "settings", l: "Konfigurasi", i: Settings },
] as const;
type Key = (typeof NAV)[number]["k"];

const PERIODS = [
  { l: "1J", h: 1 }, { l: "6J", h: 6 }, { l: "24J", h: 24 }, { l: "7H", h: 168 }, { l: "30H", h: 720 },
];

const tip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

function Dashboard() {
  const [tab, setTab] = useState<Key>("overview");
  const [hours, setHours] = useState(24);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [maxStorage, setMaxStorage] = useState<number>(STORAGE.hwl);
  const tel = useTelemetry(hours);
  const { current, trend, dhdt, storage, data, source, scenario } = tel;
  const { validation, forecast, ml, rules } = useDamSystem(data, current, dhdt, scenario);
  const operatorState = useOperatorStore();
  const chart = useMemo(() => data.map((d) => ({ ...d, time: fmtTime(d.t) })), [data]);
  const dataOk = validation.dataValid;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
            <span className="grid size-9 place-items-center rounded-lg bg-water"><Waves className="size-5 text-navy-foreground" /></span>
            <span className="leading-tight text-sidebar-foreground">
              <span className="block font-display text-sm font-bold">SENGKALING</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ops Center</span>
            </span>
          </Link>
          <nav className="space-y-1 p-3">
            {NAV.map((n) => (
              <button
                key={n.k}
                onClick={() => { setTab(n.k); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${tab === n.k ? "bg-sidebar-accent text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`}
              >
                <n.i className="size-4" />{n.l}
              </button>
            ))}
          </nav>
          <div className="mx-3 mt-4 rounded-lg border border-sidebar-border p-3 text-[11px] text-muted-foreground">
            <p className="font-semibold text-sidebar-foreground">SIMULASI</p>
            <p className="mt-1">Skenario: {SIM_SCENARIOS.find((s) => s.id === scenario)?.label}</p>
          </div>
        </aside>
        {open && <div className="fixed inset-0 z-40 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
            <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="size-5" /></button>
            <h1 className="font-display text-lg font-semibold">{NAV.find((n) => n.k === tab)?.l}</h1>
            <span className="rounded-full bg-warning/20 px-2.5 py-1 text-[11px] font-semibold text-warning">SIMULASI · DEMO</span>
            {!dataOk && <span className="rounded-full bg-destructive/20 px-2.5 py-1 text-[11px] font-semibold text-destructive">DATA TIDAK VALID</span>}
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="hidden items-center gap-1.5 sm:flex">
                <span className={`size-2 rounded-full ${dataOk ? "animate-pulse-dot bg-success" : "bg-destructive"}`} />
                {dataOk ? "Sensor OK" : "Verifikasi sensor"}
              </span>
              <span className="hidden sm:inline">Sumber: {source.name}</span>
              <span className="hidden lg:inline">Update: {current ? fmtTime(current.t) : "—"}</span>
              <NotificationBell notifications={operatorState.notifications} open={notifOpen} onToggle={() => setNotifOpen((v) => !v)} />
              <span className="grid size-8 place-items-center rounded-full bg-secondary font-semibold text-foreground">OP</span>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8">
            {(tab === "overview" || tab === "live") && (
              <>
                <StatusRow fews={rules.fews} dews={rules.dews} dataOk={dataOk} />
                <Kpis r={current} storage={storage} max={maxStorage} fews={rules.fews} dews={rules.dews} dhdt={dhdt} />
                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                  <Panel title="Time Series" right={
                    <div className="flex gap-1">{PERIODS.map((p) => (
                      <button key={p.l} onClick={() => setHours(p.h)} className={`rounded-md px-2.5 py-1 text-xs ${hours === p.h ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{p.l}</button>
                    ))}</div>
                  }>
                    <div className="h-80">
                      <ResponsiveContainer>
                        <LineChart data={chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="time" fontSize={11} stroke="var(--muted-foreground)" minTickGap={40} />
                          <YAxis yAxisId="z" domain={[108, 124]} fontSize={11} stroke="var(--muted-foreground)" />
                          <YAxis yAxisId="q" orientation="right" fontSize={11} stroke="var(--muted-foreground)" />
                          <Tooltip contentStyle={tip} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <ReferenceLine yAxisId="z" y={LEVELS.FEWS} stroke="var(--warning)" strokeDasharray="4 4" label={{ value: "FEWS +113", fontSize: 10 }} />
                          <ReferenceLine yAxisId="z" y={LEVELS.NWL} stroke="var(--success)" strokeDasharray="2 2" />
                          <Line yAxisId="z" dataKey="level" name="Muka air (m)" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
                          <Line yAxisId="q" dataKey="qin" name="Qin (m³/s)" stroke="var(--chart-2)" dot={false} />
                          <Line yAxisId="q" dataKey="qout" name="Qout (m³/s)" stroke="var(--chart-4)" dot={false} />
                          <Line yAxisId="q" dataKey="rain" name="Hujan (mm)" stroke="var(--chart-3)" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Panel>
                  <Panel title="Reservoir Level">
                    <ReservoirGauge level={dataOk ? current?.level : undefined} />
                    {rules.timeToNwlHours != null && dataOk && (
                      <p className="mt-3 text-xs text-muted-foreground">Estimasi ke NWL (proxy tren): ~{rules.timeToNwlHours.toFixed(1)} interval sampel</p>
                    )}
                  </Panel>
                </div>
                <SensorTable sensors={validation.sensors} messages={validation.messages} />
              </>
            )}
            {tab === "sensors" && <SensorTable sensors={validation.sensors} messages={validation.messages} />}
            {tab === "ml" && <MlPanel forecast={forecast} ml={ml} />}
            {tab === "fews" && <FewsPanel r={current} rules={rules} forecast={forecast} dataOk={dataOk} />}
            {tab === "dews" && <DewsPanel r={current} rules={rules} storage={storage} dataOk={dataOk} />}
            {tab === "operator" && <OperatorCenter state={operatorState} />}
            {tab === "irrigation" && <Irrigation r={current} dews={rules.dews} />}
            {tab === "safety" && <Safety validation={validation} />}
            {tab === "reports" && <Reports data={data} audit={operatorState.audit} />}
            {tab === "settings" && (
              <div className="space-y-6">
                <Panel title="Skenario Simulasi (Uji FEWS/DEWS)">
                  <p className="text-sm text-muted-foreground">Pilih skenario untuk menguji rule engine. Semua data berlabel SIMULASI.</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {SIM_SCENARIOS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => changeSimulationScenario(s.id)}
                        className={`rounded-lg border px-4 py-3 text-left text-sm ${scenario === s.id ? "border-primary bg-primary/10" : "border-border"}`}
                      >
                        <p className="font-medium">{s.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </Panel>
                <Panel title="Ambang Operasi (dokumen / SOP)">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    {[
                      ["LWL", `+${DEFAULT_DAM_CONFIG.levels.LWL} m`],
                      ["FEWS trigger evaluasi", `+${DEFAULT_DAM_CONFIG.levels.FEWS} m`],
                      ["NWL", `+${DEFAULT_DAM_CONFIG.levels.NWL} m`],
                      ["HWL/FWL", `+${DEFAULT_DAM_CONFIG.levels.HWL} m`],
                      ["dH/dt FEWS Waspada", DEFAULT_DAM_CONFIG.fewsWaspadaDhdt],
                      ["Margin FEWS Siaga (bawah NWL)", `${DEFAULT_DAM_CONFIG.fewsSiagaMarginBelowNwl} m`],
                    ].map(([a, b]) => (
                      <div key={String(a)} className="flex justify-between rounded-lg bg-muted px-3 py-2">
                        <dt className="text-muted-foreground">{a}</dt>
                        <dd className="font-mono">{b}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">Nilai dapat disesuaikan di src/lib/dam-config.ts setelah validasi SOP.</p>
                </Panel>
                <Panel title="Konfigurasi Tampungan">
                  <p className="text-sm text-muted-foreground">Pilih acuan volume untuk persentase tampungan.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[{ v: STORAGE.hwl, l: "21,197 jt m³ (tabel elevasi HWL)" }, { v: STORAGE.maxReported, l: "27,46 jt m³ (tampungan maks. dilaporkan)" }].map((o) => (
                      <button key={o.v} onClick={() => setMaxStorage(o.v)} className={`rounded-lg border px-4 py-3 text-sm ${maxStorage === o.v ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{o.l}</button>
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>{right}
      </div>
      {children}
    </section>
  );
}

function StatusRow({ fews, dews, dataOk }: { fews: string; dews: string; dataOk: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(fews as "NORMAL")}`}>FEWS: {fews}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(dews as "NORMAL")}`}>DEWS: {dews}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${dataOk ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
        Data: {dataOk ? "Valid" : "Tidak valid"}
      </span>
    </div>
  );
}

function Kpis({
  r, storage, max, fews, dews, dhdt,
}: {
  r?: import("@/lib/telemetry").Reading;
  storage: number;
  max: number;
  fews: string;
  dews: string;
  dhdt: number;
}) {
  const items = [
    { l: "Muka Air", v: r ? `+${r.level.toFixed(2)}` : "—", u: "m" },
    { l: "Tampungan", v: r ? (storage / 1e6).toFixed(2) : "—", u: `jt m³ · ${r ? ((storage / max) * 100).toFixed(0) : "—"}%` },
    { l: "Inflow Qin", v: r?.qin.toFixed(1) ?? "—", u: "m³/s" },
    { l: "Outlet Qout", v: r?.qout.toFixed(1) ?? "—", u: "m³/s" },
    { l: "Curah Hujan", v: r?.rain.toFixed(1) ?? "—", u: "mm" },
    { l: "dH/dt (proxy)", v: dhdt.toFixed(3), u: "m / sampel" },
    { l: "Status FEWS", v: fews, u: "", cls: statusBadgeClass(fews as "NORMAL") },
    { l: "Status DEWS", v: dews, u: "", cls: statusBadgeClass(dews as "NORMAL") },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((k) => (
        <div key={k.l} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</p>
          <p className={`mt-2 font-display text-2xl font-bold ${k.cls ?? ""}`}>{k.v}</p>
          <p className="text-xs text-muted-foreground">{k.u}</p>
        </div>
      ))}
    </div>
  );
}

function SensorTable({
  sensors,
  messages,
}: {
  sensors: import("@/lib/sensor-validation").SensorRecord[];
  messages: string[];
}) {
  const [q, setQ] = useState("");
  const rows = sensors.filter((s) => (s.id + s.type).toLowerCase().includes(q.toLowerCase()));
  return (
    <Panel title="Sensor ADAS & IoT" right={
      <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari sensor" className="w-32 bg-transparent outline-none" />
      </label>
    }>
      {messages.length > 0 && (
        <ul className="mb-4 space-y-1 text-sm text-warning">
          {messages.map((m) => <li key={m}>• {m}</li>)}
        </ul>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>{["ID", "Tipe", "Nilai", "Unit", "Update", "Sinyal", "Kualitas"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2.5 font-mono">{s.id}</td>
                <td className="px-3 py-2.5">{s.type}</td>
                <td className="px-3 py-2.5 font-mono">{s.value ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.unit}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.lastUpdate ? fmtTime(s.lastUpdate) : "—"}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 ${s.online ? "text-success" : "text-destructive"}`}>
                    <span className="size-1.5 rounded-full bg-current" />{s.online ? "Online" : "Offline"}
                  </span>
                </td>
                <td className={`px-3 py-2.5 ${s.quality === "Valid" ? "text-muted-foreground" : "text-warning"}`}>{s.quality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MlPanel({
  forecast,
  ml,
}: {
  forecast: import("@/lib/ml-engine").ElevationForecastPoint[];
  ml: import("@/lib/ml-engine").MlRiskInsight;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel title="Prediksi Muka Air">
        <p className="mb-3 text-xs font-semibold text-warning">{ML_DEMO_LABEL}</p>
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis domain={["auto", "auto"]} fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={tip} />
              <ReferenceLine y={LEVELS.FEWS} stroke="var(--warning)" strokeDasharray="4 4" />
              <ReferenceLine y={LEVELS.LWL} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <Area dataKey="upper" stroke="none" fill="var(--chart-1)" fillOpacity={0.12} name="Batas atas" />
              <Area dataKey="elevation" stroke="var(--chart-1)" fill="none" strokeWidth={2} name="Prediksi (m)" />
              <Area dataKey="lower" stroke="none" fill="var(--card)" fillOpacity={1} name="Batas bawah" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Faktor Risiko (baseline)">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {ml.factors.length ? ml.factors.map((f) => <li key={f}>{f}</li>) : <li>Tidak ada faktor dominan</li>}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Tren banjir</dt><dd>{ml.floodRiskTrend}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Risiko defisit</dt><dd>{ml.droughtDeficitRisk}</dd></div>
        </dl>
      </Panel>
    </div>
  );
}

function FewsPanel({
  r, rules, forecast, dataOk,
}: {
  r?: import("@/lib/telemetry").Reading;
  rules: import("@/lib/rule-engine").RuleEngineOutput;
  forecast: import("@/lib/ml-engine").ElevationForecastPoint[];
  dataOk: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Flood Early Warning System">
        <p className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${statusBadgeClass(rules.fews)}`}>{rules.fews}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {rules.factors.filter((f) => !f.includes("DEWS")).map((f) => <li key={f}>{f}</li>)}
        </ul>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">Muka air</p><p className="font-mono text-lg">{dataOk && r ? `+${r.level.toFixed(2)} m` : "—"}</p></div>
          <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">Prediksi max</p><p className="font-mono text-lg">{forecast.length ? `+${Math.max(...forecast.map((f) => f.elevation)).toFixed(2)} m` : "—"}</p></div>
        </div>
      </Panel>
      <Panel title="Rekomendasi Evaluasi">
        {rules.recommendations.filter((x) => x.system === "FEWS").map((rec) => (
          <p key={rec.id} className="text-sm text-muted-foreground">{rec.recommendedAction}</p>
        ))}
      </Panel>
    </div>
  );
}

function DewsPanel({
  r, rules, storage, dataOk,
}: {
  r?: import("@/lib/telemetry").Reading;
  rules: import("@/lib/rule-engine").RuleEngineOutput;
  storage: number;
  dataOk: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Drought Early Warning System">
        <p className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${statusBadgeClass(rules.dews)}`}>{rules.dews}</p>
        <p className="mt-4 text-sm text-muted-foreground">Estimasi tampungan: <b className="text-foreground">{(storage / 1e6).toFixed(2)} jt m³</b></p>
        {rules.timeToLwlHours != null && dataOk && (
          <p className="mt-2 text-sm text-muted-foreground">Estimasi menuju ambang LWL+margin (proxy): ~{rules.timeToLwlHours.toFixed(1)} interval</p>
        )}
      </Panel>
      <Panel title="Konservasi & Distribusi">
        {rules.recommendations.filter((x) => x.system === "DEWS").map((rec) => (
          <p key={rec.id} className="text-sm text-muted-foreground">{rec.recommendedAction}</p>
        ))}
        <p className="mt-4 text-xs text-muted-foreground">Kebutuhan air baku wajib dan irigasi mengikuti kebijakan alokasi — tidak menghentikan seluruh pelepasan secara otomatis.</p>
      </Panel>
    </div>
  );
}

function Irrigation({ r, dews }: { r?: import("@/lib/telemetry").Reading; dews: string }) {
  const blocks = [["Blok Utara", 1200], ["Blok Tengah", 1350], ["Blok Selatan", 950]] as const;
  const supply = r ? Math.min(2.5, r.qout * 0.12) : 0;
  const factor = dews === "SIAGA" ? 0.7 : dews === "WASPADA" ? 0.85 : 1;
  return (
    <Panel title="Distribusi Air Irigasi · 3.500 ha">
      <p className="text-sm text-muted-foreground">Suplai simulasi: <b className="text-foreground">{(supply * factor).toFixed(2)} m³/det</b> (faktor DEWS: {factor})</p>
      <div className="mt-6 space-y-4">
        {blocks.map(([n, ha]) => {
          const pct = (supply * factor / 2.5) * 100;
          return (
            <div key={n}>
              <div className="flex justify-between text-sm"><span>{n} · {ha} ha</span><span className="font-mono">{pct.toFixed(0)}%</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-success" style={{ width: `${Math.min(100, pct)}%` }} /></div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Safety({ validation }: { validation: import("@/lib/sensor-validation").ValidationResult }) {
  const sp = validation.sensors.find((s) => s.id === "SP-01");
  const pz = validation.sensors.find((s) => s.id === "PZ-03");
  const df = validation.sensors.find((s) => s.id === "DF-02");
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Panel title="Piezometer"><p className={`text-sm ${pz?.quality === "Valid" ? "text-success" : "text-warning"}`}>{pz?.quality === "Valid" ? "Stabil" : "Perlu verifikasi"}</p></Panel>
      <Panel title="Rembesan"><p className={`text-sm ${sp?.quality === "Valid" ? "text-success" : "text-warning"}`}>{sp?.value} L/s — {sp?.quality}</p></Panel>
      <Panel title="Deformasi"><p className="text-sm text-destructive">{df?.online ? "Online" : "GNSS terputus"}</p></Panel>
      <div className="md:col-span-3">
        <Panel title="Kontak RTD (konfigurasi)">
          <ul className="text-sm text-muted-foreground">
            {DEFAULT_DAM_CONFIG.emergencyContacts.map((c) => (
              <li key={c.role}>{c.role}: {c.name} · {c.phone}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Reports({
  data,
  audit,
}: {
  data: import("@/lib/telemetry").Reading[];
  audit: import("@/lib/operator-workflow").AuditLogEntry[];
}) {
  const exportCsv = () => {
    const rows = ["timestamp,level_m,qin_m3s,qout_m3s,rain_mm,gate_pct", ...data.map((d) => [new Date(d.t).toISOString(), d.level.toFixed(3), d.qin.toFixed(2), d.qout.toFixed(2), d.rain.toFixed(2), d.gate.toFixed(1)].join(","))];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "sengkaling-telemetry.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <Panel title="Data Historis" right={<button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"><Download className="size-4" />Export CSV</button>}>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground"><tr>{["Waktu", "Z (m)", "Qin", "Qout", "Hujan", "Pintu"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{[...data].reverse().slice(0, 100).map((d) => (
              <tr key={d.t} className="border-t border-border font-mono"><td className="px-3 py-2 font-sans">{fmtTime(d.t)}</td><td className="px-3 py-2">{d.level.toFixed(2)}</td><td className="px-3 py-2">{d.qin.toFixed(1)}</td><td className="px-3 py-2">{d.qout.toFixed(1)}</td><td className="px-3 py-2">{d.rain.toFixed(1)}</td><td className="px-3 py-2">{d.gate.toFixed(0)}%</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Audit Log Keputusan">
        <div className="max-h-64 overflow-auto text-sm">
          {audit.length === 0 && <p className="text-muted-foreground">Belum ada keputusan operator tercatat.</p>}
          {audit.map((a) => (
            <div key={a.id} className="border-b border-border py-2">
              <span className="text-muted-foreground">{new Date(a.at).toLocaleString("id-ID")}</span> · <b>{a.action}</b> — {a.detail}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
