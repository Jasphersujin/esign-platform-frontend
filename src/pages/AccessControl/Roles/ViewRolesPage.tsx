import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Globe2,
  Loader2,
  Pencil,
  RotateCcw,
  Server,
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

interface RoleResponse {
  id: string;
  roleName: string;
  roleCode: string;
  description?: string | null;

  scopeType: "GLOBAL" | "TENANT";

  tenantId?: string | null;
  tenantName?: string | null;

  organizationId?: string | null;
  organizationName?: string | null;

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
    return "RL";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
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
   SCOPE BADGE
============================================================ */

function ScopeBadge({
  scopeType,
}: {
  scopeType: "GLOBAL" | "TENANT";
}) {
  if (scopeType === "GLOBAL") {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/5 text-blue-600"
      >
        <Globe2 className="mr-1 h-3.5 w-3.5" />
        Global
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-purple-500/30 bg-purple-500/5 text-purple-600"
    >
      <Server className="mr-1 h-3.5 w-3.5" />
      Tenant
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
   PAGE
============================================================ */

export default function ViewRolesPage() {
  const navigate = useNavigate();

  const { id } = useParams<{
    id: string;
  }>();

  const [role, setRole] =
    useState<RoleResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError("Role ID is missing.");
      setIsLoading(false);
      return;
    }

    const loadRole =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await api.get<RoleResponse>(
              `/api/v1/roles/${id}`
            );

          setRole(response.data);
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
              "Failed to load role."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadRole();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!role) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete role "${role.roleName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.delete(
          `/api/v1/roles/${role.id}`
        );

        navigate("/roles");
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
            "Failed to delete role."
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
      if (!role) {
        return;
      }

      const confirmed =
        window.confirm(
          `Restore role "${role.roleName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.put(
          `/api/v1/roles/${role.id}/restore`
        );

        const response =
          await api.get<RoleResponse>(
            `/api/v1/roles/${role.id}`
          );

        setRole(response.data);
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
            "Failed to restore role."
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
            Loading role...
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
            navigate("/roles")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roles
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            Role not found.
          </CardContent>
        </Card>
      </div>
    );
  }

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
              navigate("/roles")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Role Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View role information, scope and organization association.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              {!role.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/roles/${role.id}/edit`
                    )
                  }
                  disabled={actionLoading}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              {role.deleted ? (
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

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(role.roleName)}
              </div>

              <div className="min-w-0 flex-1">

                <h2 className="break-words text-xl font-semibold">
                  {role.roleName}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Code:{" "}
                  <span className="font-medium text-foreground">
                    {role.roleCode}
                  </span>
                </p>

              </div>

              <div className="flex flex-wrap gap-2">
                <ScopeBadge
                  scopeType={role.scopeType}
                />

                <StatusBadge
                  active={role.active}
                  deleted={role.deleted}
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ROLE INFORMATION */}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Role Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Role Name"
                value={role.roleName}
              />

              <InfoItem
                label="Role Code"
                value={role.roleCode}
              />

              <InfoItem
                label="Scope"
                value={
                  role.scopeType === "GLOBAL"
                    ? "Global"
                    : "Tenant Specific"
                }
              />

              <InfoItem
                label="Version"
                value={role.version}
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="Description"
                  value={
                    role.description ||
                    "No description provided"
                  }
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* SCOPE ASSOCIATION */}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Scope Association
            </CardTitle>
          </CardHeader>

          <CardContent>

            {role.scopeType === "GLOBAL" ? (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-5">

                <div className="flex gap-3">
                  <Globe2 className="mt-0.5 h-5 w-5 text-blue-600" />

                  <div>
                    <p className="font-medium">
                      Global Role
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      This role is not restricted to a specific
                      tenant or organization.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-5 w-5 text-primary" />
                  </div>

                  <InfoItem
                    label="Tenant"
                    value={
                      role.tenantName ??
                      role.tenantId
                    }
                  />

                </div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>

                  <InfoItem
                    label="Organization"
                    value={
                      role.organizationName ??
                      role.organizationId
                    }
                  />

                </div>

              </div>
            )}

          </CardContent>
        </Card>

        {/* AUDIT INFORMATION */}

        <Card>
          <CardHeader>
            <CardTitle>
              Record Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />

                <InfoItem
                  label="Created At"
                  value={formatDateTime(
                    role.createdAt
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />

                <InfoItem
                  label="Updated At"
                  value={formatDateTime(
                    role.updatedAt
                  )}
                />
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}