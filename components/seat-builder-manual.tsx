"use client";

import type { ReactNode } from "react";
import { BookOpen, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-lg border border-zinc-200 bg-white open:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
        {title}
      </summary>
      <div className="space-y-3 border-t border-zinc-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        {children}
      </div>
    </details>
  );
}

export function SeatBuilderManual({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BookOpen className="h-4 w-4 text-zinc-500" aria-hidden />
        User manual — Bulk seat builder
      </div>

      <Section title="1. What this tool does" defaultOpen>
        <p>
          You define seats in bulk (many at once) with exact{" "}
          <strong>positions</strong> (<code className="text-xs">pos_x</code>,{" "}
          <code className="text-xs">pos_y</code>), row labels, seat numbers, and
          default appearance. Then you either <strong>save to the API</strong>{" "}
          or <strong>open Hall layout</strong> to drag, curve rows, or fine-tune.
        </p>
      </Section>

      <Section title="2. Uniform grid vs Custom rows">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Uniform grid</strong> — One rectangle: same number of seats
            every row, fixed horizontal and vertical spacing. Use global numbering
            (left-to-right, right-to-left, or serpentine) and optional alternating
            row mirroring.
          </li>
          <li>
            <strong>Custom rows</strong> — Each row is edited separately: how many
            seats, where the row starts in X/Y, horizontal gap between seats, mirror
            that row, and optionally a <strong>different price tier</strong> per
            row. Use this for fan-shaped blocks, shorter back rows, VIP strips,
            gaps for aisles (by shifting <code className="text-xs">Start X</code>
            ), etc.
          </li>
        </ul>
        <p className="rounded-md bg-amber-50/90 px-3 py-2 text-amber-950 dark:bg-amber-950/35 dark:text-amber-100">
          Switching mode copies your current layout into the other editor when
          possible (Uniform → Custom expands each row; Custom → Uniform guesses rows
          × spacing — check numbers after switching).
        </p>
      </Section>

      <Section title="3. Target (hall, section, tier)">
        <p>
          Every new seat belongs to one hall and section. The{" "}
          <strong>default price tier</strong> applies to all seats in Uniform mode,
          and to Custom rows where the row tier is set to “Default”.
        </p>
      </Section>

      <Section title="4. Uniform grid fields">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Rows / Seats per row</strong> — Grid size.
          </li>
          <li>
            <strong>First row letter / First seat number</strong> — Row labels
            increment A, B, C… Seat numbers follow the chosen numbering mode.
          </li>
          <li>
            <strong>Seat numbering</strong> — LTR, RTL, or Serpentine (snake).
          </li>
          <li>
            <strong>Next row direction</strong> — Whether the next row increases or
            decreases <code className="text-xs">pos_y</code>.
          </li>
          <li>
            <strong>Mirror alternating rows</strong> — Flips seat order on every
            other row (often paired with serpentine).
          </li>
        </ul>
      </Section>

      <Section title="5. Custom rows table">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Row</strong> — Label stored with the seat (e.g. A, B, VIP).
          </li>
          <li>
            <strong>Seats</strong> — Count in that row only.
          </li>
          <li>
            <strong>Start X / Start Y</strong> — Anchor of the first seat in that
            row (before mirroring).
          </li>
          <li>
            <strong>Step X</strong> — Distance between adjacent seats along the
            row.
          </li>
          <li>
            <strong>Mirror</strong> — Puts the first seat on the right; numbering
            still increases in generation order (see below).
          </li>
          <li>
            <strong>Tier</strong> — Override the default tier for that row, or leave
            Default.
          </li>
        </ul>
        <p>
          <strong>Seat numbers in Custom mode:</strong> a single global counter
          starts at <strong>First seat number</strong> and increases for each seat
          in row order (first row left-to-right, then next row, …). It does{" "}
          <em>not</em> use serpentine rules — use Uniform mode if you need those.
        </p>
      </Section>

      <Section title="6. Geometry & appearance (both modes)">
        <p>
          In Uniform mode, <strong>Start pos X/Y</strong> is the top-left anchor of
          the first seat; <strong>Step X/Y</strong> move to the next seat and next
          row. In Custom mode, each row has its own start and step; the shared block
          still sets <strong>width</strong>, <strong>height</strong>,{" "}
          <strong>shape</strong>, and <strong>rotation</strong> for every generated
          seat.
        </p>
      </Section>

      <Section title="7. Actions">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Bulk insert</strong> — Calls <code className="text-xs">POST /seats/bulk</code>{" "}
            with the preview payload.
          </li>
          <li>
            <strong>Continue in Hall layout</strong> — Sends the same seats to the
            visual editor (session handoff) for curves, drag, tier paint, rotation.
          </li>
        </ul>
      </Section>
    </div>
  );
}
