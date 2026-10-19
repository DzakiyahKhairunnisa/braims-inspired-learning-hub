import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/dam-profile", label: "Profil Bendungan" },
  { to: "/early-warning", label: "Early Warning" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-water text-navy-foreground">
            <Waves className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold tracking-tight">SENGKALING</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dam Intelligence</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link to="/dashboard" className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-navy-foreground transition hover:opacity-90">
          Dashboard
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm md:grid-cols-3 md:px-8">
        <div>
          <p className="font-display text-lg font-bold">Sengkaling Dam Intelligence Center</p>
          <p className="mt-2 opacity-70">Integrated Dam Monitoring, Early Warning, and Irrigation Operations.</p>
        </div>
        <div className="opacity-80">
          <p className="font-medium">Tim SENGKALING-64 · Universitas Brawijaya</p>
          <p className="mt-1 opacity-80">Lomba Rancang Bendungan Nasional 2026</p>
        </div>
        <p className="opacity-60">
          Seluruh nilai teknis adalah nilai rencana dari proposal desain. Data dashboard adalah data simulasi (demo) hingga sensor nyata terhubung.
        </p>
      </div>
    </footer>
  );
}
