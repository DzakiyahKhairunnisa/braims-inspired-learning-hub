import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudRain, Sun, Waves, ShieldAlert } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/early-warning")({
  head: () => ({
    meta: [
      { title: "Early Warning Systems — FEWS & DEWS Sengkaling" },
      { name: "description", content: "Konsep Flood Early Warning System dan Drought Early Warning System Bendungan Sengkaling." },
      { property: "og:title", content: "Early Warning Systems — FEWS & DEWS Sengkaling" },
      { property: "og:description", content: "Deteksi dini, release terkendali, dan konservasi tampungan." },
    ],
  }),
  component: EarlyWarning,
});

const flow = [
  { icon: Sun, t: "DEWS", z: "Z < +113 m, tren turun", d: "Konservasi tampungan; pelepasan sesuai kebutuhan irigasi & air baku." },
  { icon: Waves, t: "Normal / NWL", z: "≈ +119 m", d: "Operasi pelayanan air sesuai pola operasi waduk." },
  { icon: CloudRain, t: "FEWS", z: "Z ≥ +113 m", d: "Evaluasi inflow & prediksi ML → low-level outlet membuka bertahap." },
  { icon: ShieldAlert, t: "Spillway", z: "Z → +123 m", d: "Qin > Qoutlet → spillway mengalirkan debit banjir." },
];

function EarlyWarning() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Early Warning</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">FEWS & DEWS</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Sistem tidak menunggu muka air mencapai pelimpah. Elevasi pemicu dan prediksi real-time digunakan untuk merespons lebih awal.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {flow.map((f, i) => (
            <div key={f.t} className="relative rounded-xl border border-border bg-card p-6 shadow-card">
              <span className="absolute right-4 top-4 font-mono text-xs text-muted-foreground">{i + 1}/4</span>
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-xl font-bold">{f.t}</h3>
              <p className="mt-1 font-mono text-sm text-primary">{f.z}</p>
              <p className="mt-3 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-xl bg-water p-8 text-navy-foreground">
          <p className="font-mono text-sm opacity-80">DEWS → Konservasi Air → NWL → FEWS → Controlled Release → Spillway</p>
          <p className="mt-3 max-w-3xl text-sm opacity-80">
            Ruang tampungan antara +113 m dan +123 m menjadi flood cushion. Operator tetap memiliki manual override.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground">Lihat di Dashboard</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
