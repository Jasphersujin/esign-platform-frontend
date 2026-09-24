
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { AppDialog } from "./AppDialog";
import type { ReactNode } from "react";

export type ConfirmDialogVariant =
  | "danger"
  | "warning"
  | "success"
  | "info";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description: string;

  confirmText?: string;
  cancelText?: string;

  variant?: ConfirmDialogVariant;

  loading?: boolean;

  onConfirm: () => void | Promise<void>;

  children?: ReactNode;
}

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconClass:
      "bg-destructive/10 text-destructive",
    buttonVariant: "destructive" as const,
  },

  warning: {
    icon: AlertTriangle,
    iconClass:
      "bg-amber-500/10 text-amber-700",
    buttonVariant: "default" as const,
  },

  success: {
    icon: CheckCircle2,
    iconClass:
      "bg-emerald-500/10 text-emerald-700",
    buttonVariant: "default" as const,
  },

  info: {
    icon: Info,
    iconClass:
      "bg-primary/10 text-primary",
    buttonVariant: "default" as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];

  const Icon = config.icon;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="md"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() =>
              onOpenChange(false)
            }
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={config.buttonVariant}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}

            {loading
              ? "Please wait..."
              : confirmText}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
          <div
            className={`
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-full
              ${config.iconClass}
            `}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {title}
            </p>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {children}
      </div>
    </AppDialog>
  );
}