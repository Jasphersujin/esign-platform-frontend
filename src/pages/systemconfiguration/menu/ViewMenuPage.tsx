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

interface MenuResponse {
  id: string;
  displayName: string;
  icon: string;
  displayOrder: number;
  description?: string | null;
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
        {value ?? "Not available"}
      </p>
    </div>
  );
}

/* ============================================================
   ICON
============================================================ */

function MenuIcon({
  iconName,
}: {
  iconName: string;
}) {
  const IconComponent =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{
          className?: string;
        }>
      >
    )[iconName];

  if (!IconComponent) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <LucideIcons.Menu className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <IconComponent className="h-7 w-7" />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

const ViewMenuPage = () => {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [menu, setMenu] =
    useState<MenuResponse | null>(null);

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
      setError("Menu ID is missing.");
      setIsLoading(false);
      return;
    }

    const loadMenu =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await api.get<MenuResponse>(
              `/api/v1/menus/${id}`
            );

          setMenu(response.data);
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
              "Failed to load menu."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadMenu();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!menu) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete menu "${menu.displayName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.delete(
          `/api/v1/menus/${menu.id}`
        );

        navigate("/menus");
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
            "Failed to delete menu."
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
      if (!menu) {
        return;
      }

      const confirmed =
        window.confirm(
          `Restore menu "${menu.displayName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.put(
          `/api/v1/menus/${menu.id}/restore`
        );

        const response =
          await api.get<MenuResponse>(
            `/api/v1/menus/${menu.id}`
          );

        setMenu(response.data);
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
            "Failed to restore menu."
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
            Loading menu...
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
            navigate("/menus")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menus
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            Menu not found.
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
              navigate("/menus")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menus
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Menu Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View menu information and configuration.
              </p>
            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-2">

              {!menu.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/menus/${menu.id}/edit`
                    )
                  }
                  disabled={actionLoading}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              {menu.deleted ? (
                <Button
                  onClick={handleRestore}
                  disabled={actionLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={actionLoading}
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

              <MenuIcon
                iconName={menu.icon}
              />

              <div className="min-w-0 flex-1">

                <h2 className="break-words text-xl font-semibold">
                  {menu.displayName}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Display Order:{" "}
                  <span className="font-medium text-foreground">
                    {menu.displayOrder}
                  </span>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Icon: {menu.icon}
                </p>

              </div>

              <StatusBadge
                active={menu.active}
                deleted={menu.deleted}
              />

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

            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Display Name"
                value={menu.displayName}
              />

              <InfoItem
                label="Icon"
                value={menu.icon}
              />

              <InfoItem
                label="Display Order"
                value={menu.displayOrder}
              />

              <InfoItem
                label="Version"
                value={menu.version}
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="Description"
                  value={
                    menu.description ||
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
                      menu.createdAt
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
                      menu.updatedAt
                    )}
                  </p>
                </div>
              </div>

              <InfoItem
                label="Menu ID"
                value={menu.id}
              />

              <InfoItem
                label="Version"
                value={menu.version}
              />

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ViewMenuPage;