import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  children?: ReactNode;
  footer?: ReactNode;

  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "sm:max-w-[420px]",
  md: "sm:max-w-[520px]",
  lg: "sm:max-w-[680px]",
  xl: "sm:max-w-[900px]",
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: AppDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className={`
          ${SIZE_CLASSES[size]}
          gap-0
          overflow-hidden
          rounded-xl
          border
          bg-background
          p-0
          shadow-2xl
        `}
      >
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="mt-1.5 max-w-[620px] text-sm leading-5">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className="px-6 py-5">
            {children}
          </div>
        )}

        {footer && (
          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}