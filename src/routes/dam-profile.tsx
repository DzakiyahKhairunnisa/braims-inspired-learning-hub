import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ReservoirGauge } from "@/components/ReservoirGauge";
import { BENEFITS, FLOODS, LEVELS, STORAGE, TEAM } from "@/lib/dam-data";

export const Route = createFileRoute("/dam-profile")({
  head: () => ({
    meta: [
      { title: "Profil Teknis Bendungan Sengkaling" },
      { name: "description", content: "Data teknis rencana Bendungan Sengkaling: elevasi muka air, tampungan, debit banjir rancangan, pelimpah, dan BIM." },
      { property: "og:title", content: "Profil Teknis Bendungan Sengkaling" },
      { property: "og:description", content: "Elevasi, tampungan, debit banjir, dan komponen struktur Bendungan Sengkaling." },
    ],
  }),
  component: DamProfile,
});

const levelRows = [
  { k: "LWL", z: LEVELS.LWL, v: "5.150.000 m³" },
  { k: "FEWS Level", z: LEVELS.FEWS, v: "— (trigger operasi)" },
  { k: "NWL", z: LEVELS.NWL, v: "17.750.000 m³" },
  { k: "HWL / FWL", z: LEVELS.HWL, v: "21.197.404 m³" },
  { k: "Muka banjir QPMF", z: LEVELS.QPMF_FLOOD, v: "—" },
  { k: "Puncak bendungan", z: LEVELS.CREST, v: "Tinggi jagaan 3,5 m" },
];

const components = [
  { t: "Tubuh Bendungan Utama", d: "Bendungan urugan dengan zona inti, transisi, dan kaki hilir; elevasi puncak +127,05 m." },
  { t: "Waduk", d: "Luas permukaan ±6,24 km²; tampungan mati 5,15 juta m³ dan efektif 12,60 juta m³." },
  { t: "Spillway Utama", d: "Mercu ogee untuk melewatkan banjir rencana Q1000 dan QPMF." },
  { t: "Spillway Maintenance", d: "Jalur alternatif saat spillway utama diinspeksi atau dipelihara." },
  { t: "Low-level Outlet", d: "Pelepasan bertahap saat FEWS aktif untuk menyediakan flood cushion." },
  { t: "Terowongan Pengelak", d: "Pengalihan aliran selama konstruksi, ditutup stoplog setelah selesai." },
];

function DamProfile() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-water text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">AS Dam · Technical Profile</p>
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">Profil Bendungan Sengkaling</h1>
          <p className="mt-4 max-w-2xl opacity-80">
            Bendungan multifungsi berbasis BIM dan ADAS untuk mendukung pola operasi berbasis sistem peringatan dini. Dirancang oleh {TEAM.name}, {TEAM.university}.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold">Elevasi & Tampungan Waduk</h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr><th className="p-3">Kondisi</th><th className="p-3">Elevasi</th><th className="p-3">Volume</th></tr>
              </thead>
              <tbody>
                {levelRows.map((r) => (
                  <tr key={r.k} className="border-t border-border">
                    <td className="p-3 font-medium">{r.k}</td>
                    <td className="p-3 font-mono">+{r.z} m</td>
                    <td className="p-3 font-mono text-muted-foreground">{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-warning" />
            <p>
              <b>Catatan perbedaan data:</b> tabel elevasi mencatat volume HWL {STORAGE.hwl.toLocaleString("id-ID")} m³, sedangkan bagian lain proposal menyebut tampungan maksimum {STORAGE.maxReported.toLocaleString("id-ID")} m³. Kedua nilai ditampilkan terpisah dan dapat diatur di Settings dashboard.
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Penampang Muka Air</h2>
          <div className="mt-6"><ReservoirGauge /></div>
          <p className="mt-3 text-xs text-muted-foreground">Elevasi +113 m adalah trigger pengendalian banjir, bukan batas keselamatan bendungan.</p>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <h2 className="text-2xl font-bold">Komponen Struktur</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {components.map((c, i) => (
              <div key={c.t} className="rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-xs text-primary">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-bold">Debit Banjir Rancangan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Inflow pada lokasi bendungan (m³/det) per kala ulang.</p>
        <div className="mt-6 h-80 rounded-xl border border-border bg-card p-4">
          <ResponsiveContainer>
            <BarChart data={FLOODS}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="rp" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="q" name="Q (m³/det)" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 md:px-8 lg:grid-cols-2">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 grid-lines p-10 text-center">
          <p className="font-display text-xl font-semibold">BIM Model · Digital Twin</p>
          <p className="mt-2 text-sm text-muted-foreground">Placeholder untuk model 3D/BIM, gambar teknik, dan potongan melintang. Unggah model untuk ditampilkan di sini.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">Manfaat & Batasan Operasi</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {BENEFITS.map((b) => (
              <li key={b.key} className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">{b.label}</span><span className="font-medium">{b.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Sumber: Proposal LRBN 2026 SENGKALING-64. Semua nilai adalah nilai rencana desain, bukan hasil pengukuran operasional.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
