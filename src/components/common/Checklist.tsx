import React from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   TYPES
   ============================================================ */

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  required?: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

/* ============================================================
   CHECKLIST
   ============================================================ */

export function Checklist({
  items,
  title = "Configuration checklist",
  description = "Review the configuration before continuing.",
  compact = false,
  className,
}: ChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  const completionPercentage =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-background",
        className
      )}
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className={cn(
          "border-b",
          compact ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* Completion count */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-foreground">
              {completedCount}/{totalCount}
            </p>

            <p className="text-[11px] text-muted-foreground">
              completed
            </p>
          </div>
        </div>

        {/* ====================================================
            PROGRESS
            ==================================================== */}

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Progress
            </span>

            <span className="text-[11px] font-medium text-muted-foreground">
              {completionPercentage}%
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          ITEMS
          ====================================================== */}

      <div
        className={cn(
          "space-y-2",
          compact ? "p-3" : "p-4"
        )}
      >
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-center">
            <p className="text-sm font-medium text-foreground">
              No checklist items
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              There are no configuration checks to display.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CHECKLIST ITEM
   ============================================================ */

interface ChecklistItemRowProps {
  item: ChecklistItem;
  compact?: boolean;
}

function ChecklistItemRow({
  item,
  compact = false,
}: ChecklistItemRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border transition-colors",
        compact ? "p-3" : "p-3.5",

        item.completed
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
          : "border-border bg-background hover:bg-muted/30"
      )}
    >
      {/* ====================================================
          CHECK ICON
          ==================================================== */}

      <div className="mt-0.5 shrink-0">
        {item.completed ? (
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              compact ? "h-5 w-5" : "h-6 w-6",
              "bg-emerald-600 text-white"
            )}
          >
            <Check
              className={cn(
                compact ? "h-3 w-3" : "h-3.5 w-3.5",
                "stroke-[2.5]"
              )}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-full border",
              compact ? "h-5 w-5" : "h-6 w-6",
              "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            <Circle
              className={cn(
                compact ? "h-2.5 w-2.5" : "h-3 w-3",
                "fill-muted-foreground/20"
              )}
            />
          </div>
        )}
      </div>

      {/* ====================================================
          CONTENT
          ==================================================== */}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              item.completed
                ? "text-foreground"
                : "text-foreground"
            )}
          >
            {item.label}
          </p>

          {/* Required badge */}
          {item.required && (
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-1.5 py-0.5",
                "text-[10px] font-medium uppercase tracking-wide",
                "border-border bg-muted text-muted-foreground"
              )}
            >
              Required
            </span>
          )}
        </div>

        {item.description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      {/* ====================================================
          STATUS
          ==================================================== */}

      <div className="shrink-0">
        {item.completed ? (
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            Complete
          </span>
        ) : (
          <span className="text-[11px] font-medium text-muted-foreground">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

export default Checklist;