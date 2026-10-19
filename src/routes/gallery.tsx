import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { LOCATION } from "@/lib/dam-data";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Galeri Rancangan — Bendungan Sengkaling" },
      {
        name: "description",
        content: "Galeri visual rancangan Bendungan Sengkaling: penampang, spillway, waduk, BIM, dan komponen struktur.",
      },
      { property: "og:title", content: "Galeri Rancangan Bendungan Sengkaling" },
    ],
  }),
  component: GalleryPage,
});

const GALLERY = [
  { src: "/gallery/sengkaling-01.jpg", title: "Vista waduk dan bendungan utama", tag: "Perspektif 3D" },
  { src: "/gallery/sengkaling-02.jpg", title: "Penampang melintang tubuh bendungan", tag: "Teknik" },
  { src: "/gallery/sengkaling-03.jpg", title: "Zona inti dan filter bendungan urugan", tag: "Struktur" },
  { src: "/gallery/sengkaling-04.jpg", title: "Spillway utama mercu ogee", tag: "Pelimpah" },
  { src: "/gallery/sengkaling-05.jpg", title: "Low-level outlet & pintu pelepasan", tag: "Operasi" },
  { src: "/gallery/sengkaling-06.jpg", title: "Terowongan pengelak konstruksi", tag: "Konstruksi" },
  { src: "/gallery/sengkaling-07.jpg", title: "BIM model integrasi ADAS", tag: "BIM" },
  { src: "/gallery/sengkaling-08.jpg", title: "Layout instrumentasi piezometer", tag: "ADAS" },
  { src: "/gallery/sengkaling-09.jpg", title: "Peta topografi area rencana", tag: "Lokasi" },
  { src: "/gallery/sengkaling-10.jpg", title: "Skema irigasi 3.500 ha", tag: "Irigasi" },
  { src: "/gallery/sengkaling-11.jpg", title: "Konsep floating solar PV", tag: "Energi" },
  { src: "/gallery/sengkaling-12.jpg", title: "Siteplan pariwisata waduk", tag: "Multipurpose" },
  { src: "/gallery/sengkaling-13.jpg", title: "Kurva kapasitas tampungan", tag: "Hidrologi" },
  { src: "/gallery/sengkaling-14.jpg", title: "Skenario banjir Q1000", tag: "FEWS" },
  { src: "/gallery/sengkaling-15.jpg", title: "Tim SENGKALING-64 — UB", tag: "LRBN 2026" },
] as const;

function GalleryPage() {
  const [lightbox, setLightbox] = useState<(typeof GALLERY)[number] | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-water text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">Dokumentasi Desain</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Galeri Rancangan Bendungan Sengkaling</h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85">
            Kumpulan visual proposal LRBN SENGKALING-64 — Bendungan Sengkaling, {LOCATION.label}. Ilustrasi rancangan (bukan foto lapangan).
          </p>
          <Link to="/dashboard" className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
            Buka Dashboard Operasi
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
        {GALLERY.map((item) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setLightbox(item)}
            className="group relative overflow-hidden rounded-xl border border-border bg-card text-left shadow-card transition hover:border-primary/50"
          >
            <img
              src={item.src}
              alt={item.title}
              width={640}
              height={400}
              className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy/80 to-transparent p-4 opacity-90">
              <div>
                <span className="rounded bg-navy-foreground/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">{item.tag}</span>
                <p className="mt-2 text-sm font-semibold text-navy-foreground">{item.title}</p>
              </div>
              <ZoomIn className="ml-auto size-5 text-navy-foreground opacity-0 transition group-hover:opacity-100" />
            </div>
          </button>
        ))}
      </section>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur" role="dialog" aria-modal="true">
          <button type="button" className="absolute right-4 top-4 rounded-lg border border-border p-2" onClick={() => setLightbox(null)} aria-label="Tutup">
            <X className="size-5" />
          </button>
          <div className="max-h-[90vh] max-w-5xl overflow-hidden rounded-xl border border-border bg-card">
            <img src={lightbox.src} alt={lightbox.title} className="max-h-[75vh] w-full object-contain bg-muted" />
            <div className="border-t border-border p-4">
              <p className="font-semibold">{lightbox.title}</p>
              <p className="text-sm text-muted-foreground">{lightbox.tag} · Ilustrasi rancangan proposal</p>
            </div>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
