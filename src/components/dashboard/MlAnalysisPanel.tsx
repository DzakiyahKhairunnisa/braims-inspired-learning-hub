import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LEVELS } from "@/lib/dam-data";
import { SENGKALING_LEVELS_GUIDE } from "@/lib/sengkaling-monitoring";
import {
  ML_COEFFICIENTS,
  ML_DEMO_LABEL,
  ML_METHODOLOGY_SUMMARY,
  buildMlModelSnapshot,
  type ElevationForecastPoint,
  type MlRiskInsight,
} from "@/lib/ml-engine";
import type { Reading } from "@/lib/telemetry";
import { ML_METHODOLOGY_SECTIONS } from "@/lib/ml-methodology-doc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const tip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-emerald-100/80 bg-white p-5 shadow-card">
      <h2 className="mb-4 font-display text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function MlAnalysisPanel({
  data,
  dataOk,
  forecast,
  ml,
}: {
  data: Reading[];
  dataOk: boolean;
  forecast: ElevationForecastPoint[];
  ml: MlRiskInsight;
}) {
  const snapshot = buildMlModelSnapshot(dataOk ? data : []);

  return (
    <div className="space-y-6">
      <Panel title="Metode analisis (Machine Learning baseline)">
        <p className="text-xs font-semibold text-warning">{ML_DEMO_LABEL}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Jenis model</dt>
            <dd className="font-medium">{ML_METHODOLOGY_SUMMARY.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kelas</dt>
            <dd>{ML_METHODOLOGY_SUMMARY.class}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Keluaran</dt>
            <dd>{ML_METHODOLOGY_SUMMARY.output}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground">
          <p className="mb-2 font-sans text-sm font-semibold">Rumus proyeksi elevasi (horizon h jam)</p>
          <p>Z(h) = Z_t + h × (0,5·m + β_P + β_Q)</p>
          <p className="mt-2 text-muted-foreground">
            Interval ketidakpastian: [Z(h) − ε_i , Z(h) + ε_i] dengan ε_i = {ML_COEFFICIENTS.bandBaseM} + i ×{" "}
            {ML_COEFFICIENTS.bandStepM} (i = indeks horizon 0…{snapshot.horizonsHours.length - 1})
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Hasil modul ini hanya masukan ke rule engine FEWS/DEWS; keputusan operasi tetap di Operator BU setelah ADAS
          valid.
        </p>
      </Panel>

      <Panel title="Penjelasan metodologi lengkap (teori vs implementasi)">
        <p className="mb-4 text-sm text-muted-foreground">
          Bagian ini menjawab: dari mana acuan teori, apa yang dipakai di kode, hubungannya dengan rancangan
          Sengkaling, dan apakah bertentangan dengan persamaan desain bendungan.
        </p>
        <Accordion type="multiple" defaultValue={["theory", "implemented"]} className="w-full">
          {ML_METHODOLOGY_SECTIONS.map((sec) => (
            <AccordionItem key={sec.id} value={sec.id}>
              <AccordionTrigger className="text-left font-semibold">{sec.title}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2 text-sm text-muted-foreground">
                  {sec.paragraphs.map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                  {sec.formulas?.map((f) => (
                    <div key={f.expr} className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-xs font-semibold text-foreground">{f.label}</p>
                      <p className="mt-1 font-mono text-xs text-primary">{f.expr}</p>
                      {f.note && <p className="mt-2 text-xs">{f.note}</p>}
                    </div>
                  ))}
                  {sec.bullets && (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {sec.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Bahan analisis (variabel masukan)">
          {!snapshot.valid ? (
            <p className="text-sm text-destructive">{snapshot.reason ?? "Data tidak siap."}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-2">Simbol</th>
                  <th className="pb-2 pr-2">Variabel</th>
                  <th className="pb-2 pr-2">Nilai</th>
                  <th className="pb-2">Sumber</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.inputs.map((v) => (
                  <tr key={v.symbol} className="border-t border-border">
                    <td className="py-2 pr-2 font-mono text-primary">{v.symbol}</td>
                    <td className="py-2 pr-2">{v.label}</td>
                    <td className="py-2 pr-2 font-mono">
                      {v.value != null ? `${v.value.toFixed(v.unit === "m" ? 2 : 1)} ${v.unit}` : "—"}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{v.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Deret waktu dari telemetri BSK-SBW (simulasi); gradien memakai {ML_COEFFICIENTS.slopeLookbackSteps} sampel
            terakhir (~{ML_COEFFICIENTS.slopeLookbackSteps * 5} detik pada interval 5 detik).
          </p>
        </Panel>

        <Panel title="Turunan model (nilai saat ini)">
          {snapshot.derived.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {snapshot.derived.map((d) => (
                <li key={d.symbol} className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="font-mono text-xs text-primary">{d.symbol}</p>
                  <p className="font-medium">{d.label}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{d.formula}</p>
                  <p className="mt-2 font-mono text-base">
                    = {d.value != null ? d.value : "—"} {d.unit}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Panel title="Grafik proyeksi Z(h)">
          <p className="mb-3 text-xs text-muted-foreground">
            Horizon: {snapshot.horizonsHours.map((h) => `+${h}j`).join(" · ")} · Referensi FEWS +{SENGKALING_LEVELS_GUIDE.fews.z}{" "}
            m · NWL +{SENGKALING_LEVELS_GUIDE.nwl.z} m · LWL +{SENGKALING_LEVELS_GUIDE.lwl.z} m
          </p>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={["auto", "auto"]} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tip} />
                <ReferenceLine y={LEVELS.FEWS} stroke="var(--warning)" strokeDasharray="4 4" />
                <ReferenceLine y={LEVELS.NWL} stroke="var(--success)" strokeDasharray="2 2" />
                <ReferenceLine y={LEVELS.LWL} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <Area dataKey="upper" stroke="none" fill="var(--chart-1)" fillOpacity={0.12} name="Batas atas" />
                <Area dataKey="elevation" stroke="var(--chart-1)" fill="none" strokeWidth={2} name="Z(h) prediksi" />
                <Area dataKey="lower" stroke="none" fill="var(--card)" fillOpacity={1} name="Batas bawah" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Klasifikasi risiko (keluaran ke FEWS/DEWS)">
          <ul className="list-disc space-y-2 pl-5 text-xs text-muted-foreground">
            {snapshot.riskRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {ml.factors.length ? ml.factors.map((f) => <li key={f}>{f}</li>) : <li>Tidak ada faktor dominan pada sampel ini</li>}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tren banjir (ML)</dt>
              <dd className="font-medium">{ml.floodRiskTrend}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Risiko defisit (ML)</dt>
              <dd className="font-medium">{ml.droughtDeficitRisk}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Skor anomali Q_in</dt>
              <dd className="font-mono">{ml.anomalyScore.toFixed(2)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
