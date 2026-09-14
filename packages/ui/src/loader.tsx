"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "./cn";

// Matches the .sig-orbit duration in motion.css so the readout and the arc stay in step.
const LOOP_MS = 2400;

export type LoaderProps = {
  /** Rendered width of the disc in px. */
  size?: number;
  /** End of the arc gradient. Defaults to Flare. */
  color?: string;
  /** Start of the arc gradient. */
  accentColor?: string;
  /** Pass null for decorative use where surrounding text already says it is working. */
  label?: string | null;
  showLabel?: boolean;
  /**
   * The readout is decorative, not real progress. Default on above 40px; below that it is
   * unreadable, and the disc that hosts it is dropped for a plain gradient ring.
   */
  showPercent?: boolean;
  /** "current" inherits the parent's text colour, which keeps contrast on filled buttons. */
  tone?: "flare" | "current";
  className?: string;
};

export function Loader({
  size = 66,
  color = "var(--accent)",
  accentColor = "#ffa53d",
  label = "loading…",
  showLabel = false,
  showPercent,
  tone = "flare",
  className,
}: LoaderProps) {
  // Two loaders on one page would otherwise share DOM ids and steal each other's gradient.
  const uid = useId().replace(/:/g, "");
  const disc = showPercent ?? size >= 40;
  const percent = useLoopPercent(disc);
  const plain = tone === "current";

  return (
    <span
      role={label === null ? undefined : "status"}
      aria-live={label === null ? undefined : "polite"}
      aria-hidden={label === null || undefined}
      className={cn("inline-flex select-none flex-col items-center justify-center", className)}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={disc ? "overflow-visible" : undefined}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`halo-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="50%" stopColor="#ff7a2f" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Without the disc the arc needs a track behind it to read as a ring. */}
        {disc ? null : (
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke={plain ? "currentColor" : "var(--line)"}
            strokeWidth="9"
            opacity={plain ? 0.3 : 1}
          />
        )}

        <g className="sig-orbit">
          <path
            d="M 50 14 A 36 36 0 0 1 85 42"
            fill="none"
            stroke={plain ? "currentColor" : `url(#halo-${uid})`}
            strokeWidth="9"
            strokeLinecap="round"
            // Blur turns to mush at button scale, so the glow is disc-only.
            filter={disc ? `url(#glow-${uid})` : undefined}
          />
        </g>

        {disc ? (
          <>
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="var(--panel)"
              stroke="var(--line)"
              strokeWidth="0.8"
            />
            <text
              x="50"
              y="54.5"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--fg)"
              fontSize="15"
              fontWeight="600"
              className="tabular"
            >
              {percent}%
            </text>
          </>
        ) : null}
      </svg>

      {label === null ? null : showLabel ? (
        <span className="mt-2 text-[13px] text-[var(--mute)]">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

/** Centred loader for filling a pane or a whole route. */
export function LoaderPane({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("grid h-full min-h-[240px] w-full place-items-center", className)}>
      <Loader size={66} label={label} showLabel={Boolean(label)} />
    </div>
  );
}

function useLoopPercent(enabled: boolean) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let start: number | null = null;
    let last = -1;

    const tick = (time: number) => {
      start ??= time;
      const next = Math.floor((((time - start) % LOOP_MS) / LOOP_MS) * 100);
      // rAF fires ~60x/s but the readout only changes ~42x/s; skip the duplicate renders.
      if (next !== last) {
        last = next;
        setPercent(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);

  return percent;
}
