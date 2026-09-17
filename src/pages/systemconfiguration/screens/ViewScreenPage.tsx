import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Eye,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import * as LucideIcons from "lucide-react";

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

interface ScreenResponse {
  id: string;
  screenName: string;
  menuId: string;
  menuName?: string | null;
  menu?: {
    id: string;
    displayName: string;
    icon?: string | null;
  } | null;
  screenCode: string;
  isDefault: boolean;
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
   STATUS BADGE
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
   DEFAULT BADGE
============================================================ */

function DefaultBadge({
  isDefault,
}: {
  isDefault: boolean;
}) {
  if (isDefault) {
    return (
      <Badge
        variant="outline"
        className="border-primary/30 bg-primary/5 text-primary"
      >
        <Eye className="mr-1 h-3.5 w-3.5" />
        Default Screen
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-muted-foreground"
    >
      Standard Screen
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
  value?: string | number | boolean | null;
}) {
  let displayValue:
    | string
    | number = "Not available";

  if (
    value !== null &&
    value !== undefined &&
    value !== ""
  ) {
    if (
      typeof value === "boolean"
    ) {
      displayValue =
        value ? "Yes" : "No";
    } else {
      displayValue = value;
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="break-words text-sm">
        {displayValue}
      </p>
    </div>
  );
}

/* ============================================================
   SCREEN ICON
============================================================ */

function ScreenIcon({
  screenName,
}: {
  screenName: string;
}) {
  const words =
    screenName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  let initials = "SC";

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
   MENU ICON
============================================================ */

function MenuIcon({
  iconName,
}: {
  iconName?: string | null;
}) {
  const IconComponent =
    iconName
      ? (
          LucideIcons as unknown as Record<
            string,
            React.ComponentType<{
              className?: string;
            }>
          >
        )[iconName]
      : undefined;

  if (!IconComponent) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <LucideIcons.Menu className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <IconComponent className="h-5 w-5" />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

const ViewScreenPage = () => {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [screen, setScreen] =
    useState<ScreenResponse | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [actionLoading, setActionLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  /* ==========================================================
     LOAD SCREEN
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError(
        "Screen ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const loadScreen =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await api.get<ScreenResponse>(
              `/api/v1/screens/${id}`
            );

          setScreen(
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
              "Failed to load screen."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadScreen();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!screen) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete screen "${screen.screenName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.delete(
          `/api/v1/screens/${screen.id}`
        );

        navigate("/screens");
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
            "Failed to delete screen."
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
      if (!screen) {
        return;
      }

      const confirmed =
        window.confirm(
          `Restore screen "${screen.screenName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.put(
          `/api/v1/screens/${screen.id}/restore`
        );

        const response =
          await api.get<ScreenResponse>(
            `/api/v1/screens/${screen.id}`
          );

        setScreen(
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
            "Failed to restore screen."
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
            Loading screen...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error && !screen) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-6">

        <Button
          variant="ghost"
          className="-ml-2 mb-4"
          onClick={() =>
            navigate("/screens")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Screens
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>

      </div>
    );
  }

  if (!screen) {
    return (
      <div className="w-full p-4 sm:p-6">

        <Card>
          <CardContent className="p-6">
            Screen not found.
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
              navigate("/screens")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Screens
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Screen Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View screen information and configuration.
              </p>
            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-2">

              {!screen.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/screens/${screen.id}/edit`
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

              {screen.deleted ? (
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

        {/* ERROR AFTER ACTION */}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* OVERVIEW */}

        <Card className="mb-6">
          <CardContent className="p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <ScreenIcon
                screenName={
                  screen.screenName
                }
              />

              <div className="min-w-0 flex-1">

                <h2 className="break-words text-xl font-semibold">
                  {screen.screenName}
                </h2>

                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {screen.screenCode}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    active={
                      screen.active
                    }
                    deleted={
                      screen.deleted
                    }
                  />

                  <DefaultBadge
                    isDefault={
                      screen.isDefault
                    }
                  />
                </div>

              </div>

            </div>

          </CardContent>
        </Card>

        {/* SCREEN INFORMATION */}

        <Card className="mb-6">

          <CardHeader>
            <CardTitle>
              Screen Information
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Screen Name"
                value={
                  screen.screenName
                }
              />

              <InfoItem
                label="Screen Code"
                value={
                  screen.screenCode
                }
              />

              <InfoItem
                label="Default Screen"
                value={
                  screen.isDefault
                }
              />

              <InfoItem
                label="Status"
                value={
                  screen.deleted
                    ? "Deleted"
                    : screen.active
                    ? "Active"
                    : "Inactive"
                }
              />

              <div className="sm:col-span-2">

                <InfoItem
                  label="Description"
                  value={
                    screen.description ||
                    "No description provided"
                  }
                />

              </div>

            </div>

          </CardContent>

        </Card>

        {/* MENU INFORMATION */}

        <Card className="mb-6">

          <CardHeader>
            <CardTitle>
              Menu Information
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              <MenuIcon
                iconName={
                  screen.menu?.icon
                }
              />

              <div className="min-w-0 flex-1">

                <p className="text-xs font-medium text-muted-foreground">
                  Menu
                </p>

                <p className="mt-1 text-base font-medium">
                  {screen.menuName ??
                    screen.menu
                      ?.displayName ??
                    "Not available"}
                </p>

                {screen.menu?.icon && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Icon:{" "}
                    {screen.menu.icon}
                  </p>
                )}

              </div>

            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Menu ID"
                value={
                  screen.menuId
                }
              />

              <InfoItem
                label="Menu Name"
                value={
                  screen.menuName ??
                  screen.menu
                    ?.displayName
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
                      screen.createdAt
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
                      screen.updatedAt
                    )}
                  </p>

                </div>

              </div>

              <InfoItem
                label="Screen ID"
                value={
                  screen.id
                }
              />

              <InfoItem
                label="Version"
                value={
                  screen.version
                }
              />

            </div>

          </CardContent>

        </Card>

      </div>
    </div>
  );
};

export default ViewScreenPage;