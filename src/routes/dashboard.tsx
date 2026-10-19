import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard, Activity, Radio, BrainCircuit, CloudRain, Sun, Sprout, ShieldCheck, FileBarChart, Settings,
  Bell, Waves, Download, Search, Menu,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ReservoirGauge } from "@/components/ReservoirGauge";
import { LEVELS, STORAGE, operatingMode } from "@/lib/dam-data";
import { useTelemetry, fmtTime, type Reading } from "@/lib/telemetry";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Sengkaling Dam Intelligence" },
      { name: "description", content: "Dashboard operasi Bendungan Sengkaling: muka air, debit, curah hujan, sensor ADAS, FEWS, DEWS, dan irigasi." },
      { property: "og:title", content: "Operations Dashboard — Sengkaling Dam Intelligence" },
      { property: "og:description", content: "Pemantauan IoT dan peringatan dini Bendungan Sengkaling." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const NAV = [
  { k: "overview", l: "Overview", i: LayoutDashboard },
  { k: "live", l: "Live Monitoring", i: Activity },
  { k: "sensors", l: "Sensor Management", i: Radio },
  { k: "ml", l: "Machine Learning", i: BrainCircuit },
  { k: "fews", l: "FEWS", i: CloudRain },
  { k: "dews", l: "DEWS", i: Sun },
  { k: "irrigation", l: "Irrigation Operations", i: Sprout },
  { k: "safety", l: "Dam Safety / RTD", i: ShieldCheck },
  { k: "reports", l: "Reports & Historical", i: FileBarChart },
  { k: "settings", l: "Settings", i: Settings },
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
  const [maxStorage, setMaxStorage] = useState<number>(STORAGE.hwl);
  const tel = useTelemetry(hours);
  const { current, trend, storage, data } = tel;
  const mode = current ? operatingMode(current.level, trend) : "NORMAL";
  const chart = useMemo(() => data.map((d) => ({ ...d, time: fmtTime(d.t) })), [data]);

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
        </aside>
        {open && <div className="fixed inset-0 z-40 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
            <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="size-5" /></button>
            <h1 className="font-display text-lg font-semibold">{NAV.find((n) => n.k === tab)?.l}</h1>
            <span className="rounded-full bg-warning/20 px-2.5 py-1 text-[11px] font-semibold text-warning">DEMO MODE</span>
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="hidden items-center gap-1.5 sm:flex"><span className="size-2 animate-pulse-dot rounded-full bg-success" />Sistem OK</span>
              <span className="hidden sm:inline">Sumber: {tel.source.name}</span>
              <span className="hidden lg:inline">Update: {current ? fmtTime(current.t) : "—"}</span>
              <button className="relative" aria-label="Notifikasi">
                <Bell className="size-4" />
                {mode === "FEWS" && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-destructive" />}
              </button>
              <span className="grid size-8 place-items-center rounded-full bg-secondary font-semibold text-foreground">OP</span>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8">
            {(tab === "overview" || tab === "live") && (
              <>
                <Kpis r={current} storage={storage} max={maxStorage} mode={mode} />
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
                          <ReferenceLine yAxisId="z" y={LEVELS.FEWS} stroke="var(--warning)" strokeDasharray="4 4" />
                          <Line yAxisId="z" dataKey="level" name="Muka air (m)" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
                          <Line yAxisId="q" dataKey="qin" name="Qin (m³/s)" stroke="var(--chart-2)" dot={false} />
                          <Line yAxisId="q" dataKey="qout" name="Qout (m³/s)" stroke="var(--chart-4)" dot={false} />
                          <Line yAxisId="q" dataKey="rain" name="Hujan (mm)" stroke="var(--chart-3)" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Panel>
                  <Panel title="Reservoir Level"><ReservoirGauge level={current?.level} /></Panel>
                </div>
                <SensorTable r={current} />
              </>
            )}
            {tab === "sensors" && <SensorTable r={current} />}
            {tab === "ml" && <MlPanel data={data} />}
            {tab === "fews" && <ModePanel kind="FEWS" r={current} active={mode === "FEWS" || mode === "SPILLWAY"} />}
            {tab === "dews" && <ModePanel kind="DEWS" r={current} active={mode === "DEWS"} />}
            {tab === "irrigation" && <Irrigation r={current} />}
            {tab === "safety" && <Safety />}
            {tab === "reports" && <Reports data={data} />}
            {tab === "settings" && (
              <Panel title="Konfigurasi Tampungan">
                <p className="text-sm text-muted-foreground">Proposal memuat dua nilai tampungan maksimum yang berbeda. Pilih acuan untuk perhitungan persentase.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {[{ v: STORAGE.hwl, l: "21,197 jt m³ (tabel elevasi HWL)" }, { v: STORAGE.maxReported, l: "27,46 jt m³ (tampungan maks. dilaporkan)" }].map((o) => (
                    <button key={o.v} onClick={() => setMaxStorage(o.v)} className={`rounded-lg border px-4 py-3 text-sm ${maxStorage === o.v ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{o.l}</button>
                  ))}
                </div>
              </Panel>
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

const modeStyle: Record<string, string> = {
  NORMAL: "text-success", DEWS: "text-warning", FEWS: "text-warning", SPILLWAY: "text-destructive",
};

function Kpis({ r, storage, max, mode }: { r?: Reading | undefined; storage: number; max: number; mode: string }) {
  const items = [
    { l: "Muka Air", v: r ? `+${r.level.toFixed(2)}` : "—", u: "m" },
    { l: "Tampungan", v: r ? (storage / 1e6).toFixed(2) : "—", u: `jt m³ · ${r ? ((storage / max) * 100).toFixed(0) : "—"}%` },
    { l: "Inflow Qin", v: r?.qin.toFixed(1) ?? "—", u: "m³/s" },
    { l: "Outlet Qout", v: r?.qout.toFixed(1) ?? "—", u: "m³/s" },
    { l: "Curah Hujan", v: r?.rain.toFixed(1) ?? "—", u: "mm" },
    { l: "Bukaan Pintu", v: r?.gate.toFixed(0) ?? "—", u: "%" },
    { l: "Kondisi Operasi", v: mode, u: "", cls: modeStyle[mode] },
    { l: "Peringatan Aktif", v: mode === "FEWS" || mode === "SPILLWAY" ? "1" : "0", u: "alert" },
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

function sensors(r?: Reading | undefined) {
  const t = r ? fmtTime(r.t) : "—";
  return [
    { id: "WL-01", type: "Water Level (Radar)", m: r?.level.toFixed(2), u: "m", s: "Online", q: "Valid" },
    { id: "Q-IN-01", type: "Inflow Discharge", m: r?.qin.toFixed(1), u: "m³/s", s: "Online", q: "Valid" },
    { id: "Q-OUT-01", type: "Outlet Discharge", m: r?.qout.toFixed(1), u: "m³/s", s: "Online", q: "Valid" },
    { id: "RG-01", type: "Rain Gauge", m: r?.rain.toFixed(1), u: "mm", s: "Online", q: "Valid" },
    { id: "PZ-03", type: "Piezometer (Pore Pressure)", m: "142.6", u: "kPa", s: "Online", q: "Valid" },
    { id: "SP-01", type: "Seepage V-Notch", m: "2.31", u: "L/s", s: "Online", q: "Outlier?" },
    { id: "DF-02", type: "Deformation (GNSS)", m: "—", u: "mm", s: "Disconnected", q: "Missing" },
    { id: "GT-01", type: "Gate Position", m: r?.gate.toFixed(0), u: "%", s: "Online", q: "Valid" },
    { id: "SPW-01", type: "Spillway Status", m: r && r.level >= LEVELS.HWL ? "Overflow" : "Idle", u: "", s: "Online", q: "Valid" },
  ].map((x) => ({ ...x, t: x.s === "Disconnected" ? "—" : t }));
}

function SensorTable({ r }: { r?: Reading | undefined }) {
  const [q, setQ] = useState("");
  const rows = sensors(r).filter((s) => (s.id + s.type).toLowerCase().includes(q.toLowerCase()));
  return (
    <Panel title="Sensor ADAS" right={
      <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari sensor" className="w-32 bg-transparent outline-none" />
      </label>
    }>
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
                <td className="px-3 py-2.5 font-mono">{s.m ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.u}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.t}</td>
                <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1.5 ${s.s === "Online" ? "text-success" : "text-destructive"}`}><span className="size-1.5 rounded-full bg-current" />{s.s}</span></td>
                <td className={`px-3 py-2.5 ${s.q === "Valid" ? "text-muted-foreground" : "text-warning"}`}>{s.q}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Tidak ada sensor cocok.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MlPanel({ data }: { data: Reading[] }) {
  const last = data[data.length - 1];
  const slope = data.length > 8 && last ? (last.level - data[data.length - 9]!.level) / 8 : 0;
  const forecast = last ? [1, 3, 6, 12, 24].map((h, i) => {
    const z = last.level + slope * h * 2;
    const band = 0.1 + i * 0.12;
    return { h: `+${h}j`, z: +z.toFixed(2), lo: +(z - band).toFixed(2), hi: +(z + band).toFixed(2) };
  }) : [];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel title="Prediksi Muka Air">
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="h" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis domain={["auto", "auto"]} fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={tip} />
              <ReferenceLine y={LEVELS.FEWS} stroke="var(--warning)" strokeDasharray="4 4" />
              <Area dataKey="hi" stroke="none" fill="var(--chart-1)" fillOpacity={0.15} name="Batas atas" />
              <Area dataKey="z" stroke="var(--chart-1)" fill="none" strokeWidth={2} name="Prediksi (m)" />
              <Area dataKey="lo" stroke="none" fill="var(--card)" fillOpacity={1} name="Batas bawah" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Status Model">
        <dl className="space-y-3 text-sm">
          {[["Model", "Baseline tren (demo)"], ["Versi", "v0.1-demo"], ["Input", "Zt, Qin, P, ΔZ, Qout"], ["Training terakhir", "Belum dilatih"], ["Metrik validasi", "Belum tersedia"]].map(([a, b]) => (
            <div key={a} className="flex justify-between gap-3 border-b border-border pb-2"><dt className="text-muted-foreground">{a}</dt><dd className="text-right font-medium">{b}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">Prediksi adalah decision support. Keputusan akhir tetap pada operator (manual override).</p>
      </Panel>
    </div>
  );
}

function ModePanel({ kind, r, active }: { kind: "FEWS" | "DEWS"; r?: Reading | undefined; active: boolean }) {
  const fews = kind === "FEWS";
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title={fews ? "Flood Early Warning System" : "Drought Early Warning System"}>
        <p className={`font-display text-3xl font-bold ${active ? "text-warning" : "text-success"}`}>{active ? "AKTIF" : "Standby"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {fews ? "Trigger: Z ≥ +113 m → evaluasi inflow & prediksi → outlet membuka bertahap untuk menyediakan flood cushion sebelum HWL +123 m."
            : "Trigger: Z < +113 m dengan tren turun → konservasi tampungan; kebutuhan irigasi tetap dilayani."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">Muka air</p><p className="font-mono text-lg">+{r?.level.toFixed(2) ?? "—"} m</p></div>
          <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">{fews ? "Ruang ke HWL" : "Di atas LWL"}</p><p className="font-mono text-lg">{r ? (fews ? LEVELS.HWL - r.level : r.level - LEVELS.LWL).toFixed(2) : "—"} m</p></div>
        </div>
      </Panel>
      <Panel title="Rekomendasi Operasi">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          {(fews
            ? ["Verifikasi data sensor muka air & hujan", "Bandingkan prediksi ML 6–24 jam", "Buka low-level outlet bertahap", "Notifikasi hilir bila release meningkat", "Spillway mengambil alih saat Qin > Qoutlet"]
            : ["Kurangi pelepasan non-prioritas", "Prioritaskan air baku (≥76 L/det)", "Atur jadwal rotasi irigasi", "Pantau tren penurunan harian"]
          ).map((s) => <li key={s}>{s}</li>)}
        </ol>
      </Panel>
    </div>
  );
}

function Irrigation({ r }: { r?: Reading | undefined }) {
  const blocks = [["Blok Utara", 1200], ["Blok Tengah", 1350], ["Blok Selatan", 950]] as const;
  const supply = r ? Math.min(2.5, r.qout * 0.12) : 0;
  return (
    <Panel title="Distribusi Air Irigasi · 3.500 ha">
      <p className="text-sm text-muted-foreground">Kebutuhan maksimum 2,5 m³/det. Suplai saat ini (demo): <b className="text-foreground">{supply.toFixed(2)} m³/det</b></p>
      <div className="mt-6 space-y-4">
        {blocks.map(([n, ha]) => {
          const pct = (supply / 2.5) * 100;
          return (
            <div key={n}>
              <div className="flex justify-between text-sm"><span>{n} · {ha} ha</span><span className="font-mono">{pct.toFixed(0)}%</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-success" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Pembagian blok irigasi adalah ilustrasi; pembagian aktual belum tercantum di proposal.</p>
    </Panel>
  );
}

function Safety() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {([["Piezometer", "Tekanan pori stabil", "text-success"], ["Rembesan", "Satu nilai perlu verifikasi", "text-warning"], ["Deformasi", "Sensor GNSS terputus", "text-destructive"]] as const).map(([t, d, c]) => (
        <Panel key={t} title={t ?? ""}><p className={`text-sm ${c}`}>{d}</p></Panel>
      ))}
      <div className="md:col-span-3 text-xs text-muted-foreground">Status ambang tidak sendirian menentukan keselamatan bendungan; evaluasi engineer tetap diperlukan.</div>
    </div>
  );
}

function Reports({ data }: { data: Reading[] }) {
  const exportCsv = () => {
    const rows = ["timestamp,level_m,qin_m3s,qout_m3s,rain_mm,gate_pct", ...data.map((d) => [new Date(d.t).toISOString(), d.level.toFixed(3), d.qin.toFixed(2), d.qout.toFixed(2), d.rain.toFixed(2), d.gate.toFixed(1)].join(","))];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "sengkaling-telemetry.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <Panel title="Data Historis" right={<button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"><Download className="size-4" />Export CSV</button>}>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground"><tr>{["Waktu", "Z (m)", "Qin", "Qout", "Hujan", "Pintu"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{[...data].reverse().map((d) => (
            <tr key={d.t} className="border-t border-border font-mono"><td className="px-3 py-2 font-sans">{fmtTime(d.t)}</td><td className="px-3 py-2">{d.level.toFixed(2)}</td><td className="px-3 py-2">{d.qin.toFixed(1)}</td><td className="px-3 py-2">{d.qout.toFixed(1)}</td><td className="px-3 py-2">{d.rain.toFixed(1)}</td><td className="px-3 py-2">{d.gate.toFixed(0)}%</td></tr>
          ))}</tbody>
        </table>
      </div>
    </Panel>
  );
}
