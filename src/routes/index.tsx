import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Database, Radio, Activity, BrainCircuit, Siren, UserCheck, Gauge } from "lucide-react";
import hero from "@/assets/dam-hero.jpg";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { BENEFITS, LEVELS, LOCATION, STORAGE, TEAM } from "@/lib/dam-data";
import { useTelemetry } from "@/lib/telemetry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bendungan Sengkaling — Smart Multipurpose Dam" },
      { name: "description", content: "Sengkaling Dam Intelligence Center: pemantauan bendungan, FEWS, DEWS, ADAS, IoT, dan operasi irigasi berbasis data." },
      { property: "og:title", content: "Bendungan Sengkaling — Smart Multipurpose Dam" },
      { property: "og:description", content: "Integrated Dam Monitoring, Early Warning, and Irrigation Operations." },
    ],
  }),
  component: Index,
});

const arch = [
  { icon: Radio, label: "Sensor BSK-SBW" },
  { icon: Database, label: "ADAS" },
  { icon: Cpu, label: "IoT Tele-O" },
  { icon: Database, label: "Basis Data" },
  { icon: BrainCircuit, label: "ML (baseline)" },
  { icon: Siren, label: "FEWS / DEWS" },
  { icon: UserCheck, label: "Operator BU" },
];

const stats = [
  { v: "+123 m", l: "HWL / FWL" },
  { v: "17,75 jt m³", l: "Tampungan NWL" },
  { v: "3.500 ha", l: "Layanan irigasi" },
  { v: "637 m³/s", l: "Q1000 inflow" },
];

function Index() {
  const { current, storage } = useTelemetry(24);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Visualisasi Bendungan Sengkaling dan waduk" width={1920} height={1088} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-fade" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-32 text-navy-foreground md:px-8 md:pt-44">
          <p className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/25 bg-navy/40 px-3 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur">
            LRBN Civil Zone 2026 · {TEAM.name}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.05] md:text-7xl">
            Bendungan Sengkaling — Smart Multipurpose Dam
          </h1>
          <p className="mt-5 max-w-2xl text-base opacity-85 md:text-lg">
            Rancangan bendungan multifungsi — {LOCATION.label}. Rantai ADAS → IoT → prediksi ML → FEWS/DEWS → Operator BU & WTC BWS NTB I (simulasi).
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground transition hover:opacity-90">
              Open Operations Dashboard <ArrowRight className="size-4" />
            </Link>
            <Link to="/dam-profile" className="rounded-lg border border-navy-foreground/30 bg-navy/30 px-5 py-3 font-medium backdrop-blur transition hover:bg-navy/50">
              Explore the Dam
            </Link>
            <Link to="/early-warning" className="rounded-lg border border-navy-foreground/30 bg-navy/30 px-5 py-3 font-medium backdrop-blur transition hover:bg-navy/50">
              View Early Warning Systems
            </Link>
            <Link to="/gallery" className="rounded-lg border border-navy-foreground/30 bg-navy/30 px-5 py-3 font-medium backdrop-blur transition hover:bg-navy/50">
              Galeri Rancangan
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-navy-foreground/15 bg-navy-foreground/15 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-navy/60 p-5 backdrop-blur">
                <p className="font-display text-2xl font-bold md:text-3xl">{s.v}</p>
                <p className="mt-1 text-xs uppercase tracking-wider opacity-70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Multipurpose</p>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">Satu waduk, enam manfaat</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.key} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="text-sm text-muted-foreground">{b.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-primary">{b.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{b.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">System Architecture</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Dari sensor ke keputusan operator</h2>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {arch.map((a, i) => (
              <div key={a.label} className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-navy-foreground/15 bg-navy-foreground/5 px-4 py-3">
                  <a.icon className="size-4 text-accent" />
                  <span className="text-sm font-medium">{a.label}</span>
                </div>
                {i < arch.length - 1 && <ArrowRight className="size-4 opacity-40" />}
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm opacity-70">
            Sistem otomatis tetap dilengkapi manual override oleh operator bila terjadi gangguan sensor, komunikasi, aktuator, atau prediksi yang tidak valid.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">System Status Preview</p>
            <h2 className="mt-2 text-3xl font-bold">Kondisi waduk saat ini</h2>
          </div>
          <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-foreground">DEMO DATA · Simulasi</span>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { i: Gauge, l: "Muka air", v: current ? `+${current.level.toFixed(2)} m` : "—" },
            { i: Database, l: "Tampungan", v: current ? `${(storage / 1e6).toFixed(2)} jt m³` : "—" },
            { i: Activity, l: "Inflow Qin", v: current ? `${current.qin.toFixed(1)} m³/s` : "—" },
            { i: Siren, l: "Mode", v: current ? (current.level >= LEVELS.FEWS ? "FEWS aktif" : "Normal") : "—" },
          ].map((k) => (
            <div key={k.l} className="rounded-xl border border-border bg-card p-5">
              <k.i className="size-5 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">{k.l}</p>
              <p className="mt-1 font-display text-2xl font-bold">{k.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Tampungan maksimum rancangan: {(STORAGE.max / 1e6).toFixed(2)} jt m³.</p>
      </section>
      <SiteFooter />
    </div>
  );
}
