import { Link } from "react-router-dom";
import { ArrowRight, Clock, Megaphone } from "lucide-react";

type Props = {
  hoursLeft: number | null;   // null = nothing pending
  windowHours?: number;       // ring scale, default 24
  catchLabel?: string;        // e.g. "Galunggong · 10 kg"
  deadline?: string;          // e.g. "5:30 PM"
  to?: string;                // catch details route
};

const R = 44;
const C = 2 * Math.PI * R;

export default function NeedsActionPanel({
  hoursLeft, windowHours = 24, catchLabel, deadline, to = "/catches",
}: Props) {
  const hasNext = hoursLeft !== null && catchLabel;
  const progress = hasNext ? Math.min(Math.max(hoursLeft / windowHours, 0), 1) : 0;
  const urgent = hasNext && hoursLeft <= 3;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      {/* Scene: swap in your real art. Light and dark versions. */}
      <div className="relative h-52" aria-hidden>
        <img src="/art/lighthouse-day.webp"   alt="" className="absolute inset-0 size-full object-cover dark:hidden" />
        <img src="/art/lighthouse-night.webp" alt="" className="absolute inset-0 hidden size-full object-cover dark:block" />

        {/* Lighthouse beam (night only). Tune left/top to sit on the lamp. */}
        <div
          className="anim-beam absolute left-[22%] top-[34%] hidden h-24 w-[70%] dark:block"
          style={{
            background: "linear-gradient(90deg, rgba(255,236,170,.55), transparent)",
            clipPath: "polygon(0 40%, 100% 0, 100% 100%, 0 60%)",
          }}
        />

        {/* Drifting waves: SVG is 200% wide so the -50% loop is seamless */}
        <svg className="anim-wave absolute bottom-0 left-0 h-10 w-[200%] text-brand/30"
             viewBox="0 0 1200 40" preserveAspectRatio="none">
          <path fill="currentColor"
            d="M0 20 Q 75 0 150 20 T 300 20 T 450 20 T 600 20 T 750 20 T 900 20 T 1050 20 T 1200 20 V40 H0Z" />
        </svg>

        {/* Optional: transparent boat PNG/SVG for the bobbing layer */}
        {/* <img src="/art/boat.png" alt="" className="anim-boat absolute bottom-6 left-[8%] w-28" /> */}
      </div>

      <div className="absolute left-5 top-4 flex items-start gap-3">
        <Megaphone className="size-8 text-action" aria-hidden />
        <div>
          <h2 className="text-xl font-bold text-text">Needs action</h2>
          <p className="text-sm text-text-muted">
            {hasNext
              ? urgent ? "Sell soon to avoid losing this catch." : "Nothing urgent. Your catches are steady!"
              : "No active catches right now."}
          </p>
        </div>
      </div>

      {hasNext && (
        <Link
          to={to}
          className="m-4 -mt-10 relative flex items-center gap-4 rounded-2xl bg-surface/95 p-4 shadow-md
                     border border-border focus-visible:outline-2 focus-visible:outline-brand"
        >
          <div className="relative size-24 shrink-0">
            <svg viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" strokeWidth="8" className="stroke-border" />
              <circle
                cx="50" cy="50" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
                className={urgent ? "stroke-action" : "stroke-brand"}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center leading-none">
              <span><b className="block text-2xl text-text">{Math.ceil(hoursLeft!)}</b>
              <span className="text-xs text-text-muted">hrs</span></span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-text-muted">NEXT UP</p>
            <p className="truncate text-lg font-bold text-text">{catchLabel}</p>
            {deadline && (
              <p className="flex items-center gap-1 text-sm text-text-muted">
                <Clock className="size-4" aria-hidden /> Sell before {deadline}
              </p>
            )}
          </div>
          <ArrowRight className="size-6 shrink-0 text-brand" aria-hidden />
        </Link>
      )}
    </section>
  );
}