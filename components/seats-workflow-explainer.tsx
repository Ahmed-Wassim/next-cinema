import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "builder" | "layout";

export function SeatsWorkflowExplainer({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "group rounded-xl border border-zinc-200 bg-zinc-50/80 open:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:open:bg-zinc-950/80",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
        {variant === "builder"
          ? "How the bulk builder works (read this if you want curved rows or free placement)"
          : "Typical workflow: curved front rows + straight grid + moving blocks"}
      </summary>
      <div className="space-y-4 border-t border-zinc-200 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        {variant === "builder" ? <BuilderBody /> : <LayoutBody />}
      </div>
    </details>
  );
}

function BuilderBody() {
  return (
    <>
      <p>
        <strong className="text-zinc-900 dark:text-zinc-100">
          This page only builds one simple pattern:
        </strong>{" "}
        a rectangle of seats — same number of seats per row, same spacing between
        rows and columns, every row is a straight line. That is what “grid”
        means here.
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong>Start pos Y</strong> moves the{" "}
          <em>entire block</em> up or down on the canvas (where row A starts). It
          does not curve individual rows.
        </li>
        <li>
          You <strong>cannot</strong> here say “row A and B curved, rest normal” —
          that is done <strong>after</strong>, in{" "}
          <strong>Hall layout</strong>, on top of a generated grid.
        </li>
        <li>
          You <strong>cannot</strong> add “extra” seats outside the rectangle here
          — use Hall layout and drag seats wherever you need.
        </li>
      </ul>
      <p className="rounded-lg bg-amber-50/90 px-3 py-2 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Practical flow:</strong> set rows × seats per row and spacing →
        click <strong>Continue in Hall layout</strong> → there you select row{" "}
        <strong>A</strong>, curve it, then row <strong>B</strong>, curve it,
        leave rows C+ straight, then drag whole rows or single seats to adjust{" "}
        <strong>Y</strong> or pull seats off the grid.
      </p>
    </>
  );
}

function LayoutBody() {
  return (
    <>
      <p>
        Here each seat has a real <strong>pos_x / pos_y</strong>. Dragging moves
        it freely — nothing forces seats to stay on the original grid.
      </p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Load seats with <strong>Replace layout from grid</strong> (or come from
          Bulk builder).
        </li>
        <li>
          <strong>First two rows curved, rest straight:</strong> use{" "}
          <strong>Select row</strong> → pick <strong>A</strong> →{" "}
          <strong>Curve selected seats</strong> (under Curved row). Repeat for row{" "}
          <strong>B</strong>. Other rows stay straight until you drag or curve them.
        </li>
        <li>
          <strong>Move a block in Y:</strong> select those seats (or a whole row),
          then drag — or drag row by row.
        </li>
        <li>
          <strong>Seats outside the grid:</strong> drag any seat anywhere; “off
          grid” just means different coordinates, which the API accepts.
        </li>
      </ol>
    </>
  );
}
