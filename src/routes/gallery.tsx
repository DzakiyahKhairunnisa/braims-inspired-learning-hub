import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [{ title: "Galeri Rancangan — Bendungan Sengkaling" }],
  }),
  component: GalleryPage,
});

const GALLERY = [
  "/gallery/lokasi-as-bendungan.jpg",
  "/gallery/penampang-melintang-bendungan.jpg",
  "/gallery/level-muka-air.jpg",
  "/gallery/sengkaling-01.jpg",
  "/gallery/sengkaling-02.jpg",
  "/gallery/sengkaling-03.jpg",
  "/gallery/sengkaling-04.jpg",
  "/gallery/sengkaling-05.jpg",
  "/gallery/sengkaling-06.jpg",
  "/gallery/sengkaling-07.jpg",
  "/gallery/sengkaling-08.jpg",
  "/gallery/sengkaling-09.jpg",
] as const;

function GalleryPage() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-2 px-2 py-8 sm:grid-cols-2 lg:grid-cols-3 md:px-4">
        {GALLERY.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightbox(src)}
            className="overflow-hidden rounded-lg border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <img src={src} alt="" width={640} height={400} className="aspect-[16/10] w-full object-cover" loading="lazy" />
          </button>
        ))}
      </section>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2"
            onClick={() => setLightbox(null)}
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-[92vh] max-w-full object-contain" />
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
