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

import api from "@/api/api";

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

interface ActionResponse {
  id: string;
  name: string;
  actionCode: string;
  description?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
        <Trash2 className="mr-1 h-3.5 w-3.5" />
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
   ACTION ICON
============================================================ */

function ActionIcon({
  name,
}: {
  name: string;
}) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  let initials = "AC";

  if (words.length === 1) {
    initials =
      words[0]
        .substring(0, 2)
        .toUpperCase();
  }

  if (words.length >= 2) {
    initials =
      `${words[0][0]}${words[1][0]}`
        .toUpperCase();
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
      {initials}
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

const ViewActionPage = () => {
  const navigate =
    useNavigate();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [action, setAction] =
    useState<ActionResponse | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [actionLoading, setActionLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError(
        "Action ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const loadAction =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await api.get<ActionResponse>(
              `/api/v1/actions/${id}`
            );

          setAction(
            response.data
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
              "Failed to load action."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadAction();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!action) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete action "${action.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.delete(
          `/api/v1/actions/${action.id}`
        );

        navigate("/actions");
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
            "Failed to delete action."
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
      if (!action) {
        return;
      }

      const confirmed =
        window.confirm(
          `Restore action "${action.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.put(
          `/api/v1/actions/${action.id}/restore`
        );

        const response =
          await api.get<ActionResponse>(
            `/api/v1/actions/${action.id}`
          );

        setAction(
          response.data
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
            "Failed to restore action."
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
            Loading action...
          </p>

        </div>

      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error && !action) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-6">

        <Button
          variant="ghost"
          className="-ml-2 mb-4"
          onClick={() =>
            navigate("/actions")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Actions
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>

      </div>
    );
  }

  if (!action) {
    return (
      <div className="w-full p-4 sm:p-6">

        <Card>
          <CardContent className="p-6">
            Action not found.
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
              navigate("/actions")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Actions
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Action Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View action information and configuration.
              </p>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex flex-wrap gap-2">

              {!action.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/actions/${action.id}/edit`
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

              {action.deleted ? (
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

        {/* ACTION ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* OVERVIEW */}

        <Card className="mb-6">

          <CardContent className="p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <ActionIcon
                name={
                  action.name
                }
              />

              <div className="min-w-0 flex-1">

                <h2 className="break-words text-xl font-semibold">
                  {action.name}
                </h2>

                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {
                    action.actionCode
                  }
                </p>

                <div className="mt-3">
                  <StatusBadge
                    active={
                      action.active
                    }
                    deleted={
                      action.deleted
                    }
                  />
                </div>

              </div>

            </div>

          </CardContent>

        </Card>

        {/* ACTION INFORMATION */}

        <Card className="mb-6">

          <CardHeader>
            <CardTitle>
              Action Information
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Name"
                value={
                  action.name
                }
              />

              <InfoItem
                label="Action Code"
                value={
                  action.actionCode
                }
              />

              <InfoItem
                label="Status"
                value={
                  action.deleted
                    ? "Deleted"
                    : action.active
                    ? "Active"
                    : "Inactive"
                }
              />

              <InfoItem
                label="Version"
                value={
                  action.version
                }
              />

              <div className="sm:col-span-2">

                <InfoItem
                  label="Description"
                  value={
                    action.description ||
                    "No description provided"
                  }
                />

              </div>

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
                      action.createdAt
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
                      action.updatedAt
                    )}
                  </p>

                </div>

              </div>

              <InfoItem
                label="Action ID"
                value={
                  action.id
                }
              />

              <InfoItem
                label="Version"
                value={
                  action.version
                }
              />

            </div>

          </CardContent>

        </Card>

      </div>

    </div>
  );
};

export default ViewActionPage;