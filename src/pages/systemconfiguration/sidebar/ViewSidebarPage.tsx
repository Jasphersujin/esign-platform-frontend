
import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getSidebarById,
  deleteSidebar,
  restoreSidebar,
} from "@/api/sidebar.api";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

/* ============================================================
   TYPES
============================================================ */

interface SidebarResponse {
  id: string;
  displayName: string;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   HELPERS
============================================================ */

function formatDateTime(
  value?: string
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getInitials(
  value?: string
): string {
  if (!value) {
    return "SB";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase()
    )
    .join("");
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  active,
  deleted,
}: {
  active: boolean;
  deleted: boolean;
}) {
  if (deleted) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/5 text-destructive"
      >
        Deleted
      </Badge>
    );
  }

  if (active) {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/5 text-green-600"
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-orange-500/30 bg-orange-500/5 text-orange-600"
    >
      Inactive
    </Badge>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="break-words text-sm">
        {value ??
          "Not available"}
      </p>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ViewSidebarPage() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [
    sidebar,
    setSidebar,
  ] = useState<
    SidebarResponse | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState<boolean>(
    true
  );

  const [
    actionLoading,
    setActionLoading,
  ] = useState<boolean>(
    false
  );

  const [
    error,
    setError,
  ] = useState<string>("");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError(
        "Sidebar ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const loadSidebar =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setError("");

          const data =
            await getSidebarById(id);

          setSidebar(
            data as SidebarResponse
          );
        } catch (error) {
          const apiError = error as {
            response?: {
              data?: ApiErrorResponse;
            };
            message?: string;
          };

          setError(
            apiError.response?.data?.message ??
              apiError.response?.data?.error ??
              apiError.message ??
              "Failed to load sidebar."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadSidebar();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!sidebar) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete sidebar "${sidebar.displayName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await deleteSidebar(
          sidebar.id
        );

        navigate("/sidebars");
      } catch (error) {
        const apiError = error as {
          response?: {
            data?: ApiErrorResponse;
          };
          message?: string;
        };

        setError(
          apiError.response?.data?.message ??
            apiError.response?.data?.error ??
            apiError.message ??
            "Failed to delete sidebar."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ==========================================================
     RESTORE
  ========================================================== */

  const handleRestore =
    async (): Promise<void> => {
      if (!sidebar) {
        return;
      }

      const confirmed =
        window.confirm(
          `Restore sidebar "${sidebar.displayName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await restoreSidebar(
          sidebar.id
        );

        const data =
          await getSidebarById(
            sidebar.id
          );

        setSidebar(
          data as SidebarResponse
        );
      } catch (error) {
        const apiError = error as {
          response?: {
            data?: ApiErrorResponse;
          };
          message?: string;
        };

        setError(
          apiError.response?.data?.message ??
            apiError.response?.data?.error ??
            apiError.message ??
            "Failed to restore sidebar."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading sidebar...
          </p>

        </div>

      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-6">

        <Button
          variant="ghost"
          className="-ml-2 mb-4"
          onClick={() =>
            navigate("/sidebars")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sidebars
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>

      </div>
    );
  }

  if (!sidebar) {
    return (
      <div className="w-full p-4 sm:p-6">

        <Card>
          <CardContent className="p-6">
            Sidebar not found.
          </CardContent>
        </Card>

      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20">

      <div className="w-full max-w-5xl p-4 sm:p-6">

        {/* HEADER */}

        <div className="mb-6">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-3"
            onClick={() =>
              navigate("/sidebars")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sidebars
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Sidebar Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View sidebar information and configuration.
              </p>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-2">

              {!sidebar.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/sidebars/${sidebar.id}/edit`
                    )
                  }
                  disabled={
                    actionLoading
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              {sidebar.deleted ? (
                <Button
                  onClick={
                    handleRestore
                  }
                  disabled={
                    actionLoading
                  }
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={
                    handleDelete
                  }
                  disabled={
                    actionLoading
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}

            </div>

          </div>

        </div>

        {/* OVERVIEW */}

        <Card className="mb-6">

          <CardContent className="p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(
                  sidebar.displayName
                )}
              </div>

              <div className="min-w-0 flex-1">

                <h2 className="break-words text-xl font-semibold">
                  {sidebar.displayName}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Display Order:{" "}
                  <span className="font-medium text-foreground">
                    {sidebar.displayOrder}
                  </span>
                </p>

              </div>

              <StatusBadge
                active={
                  sidebar.active
                }
                deleted={
                  sidebar.deleted
                }
              />

            </div>

          </CardContent>

        </Card>

        {/* SIDEBAR INFORMATION */}

        <Card className="mb-6">

          <CardHeader>

            <CardTitle>
              Sidebar Information
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Display Name"
                value={
                  sidebar.displayName
                }
              />

              <InfoItem
                label="Display Order"
                value={
                  sidebar.displayOrder
                }
              />

              <InfoItem
                label="Icon"
                value={
                  sidebar.icon ||
                  "No icon configured"
                }
              />

              <div className="sm:col-span-2">

                <InfoItem
                  label="Description"
                  value={
                    sidebar.description ||
                    "No description provided"
                  }
                />

              </div>

              <InfoItem
                label="Version"
                value={
                  sidebar.version
                }
              />

            </div>

          </CardContent>

        </Card>

        {/* AUDIT INFORMATION */}

        <Card>

          <CardHeader>

            <CardTitle>
              Audit Information
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              <div className="flex gap-3">

                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div>

                  <p className="text-xs font-medium text-muted-foreground">
                    Created At
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDateTime(
                      sidebar.createdAt
                    )}
                  </p>

                </div>

              </div>

              <div className="flex gap-3">

                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div>

                  <p className="text-xs font-medium text-muted-foreground">
                    Updated At
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDateTime(
                      sidebar.updatedAt
                    )}
                  </p>

                </div>

              </div>

              <InfoItem
                label="Sidebar ID"
                value={
                  sidebar.id
                }
              />

              <InfoItem
                label="Version"
                value={
                  sidebar.version
                }
              />

            </div>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}