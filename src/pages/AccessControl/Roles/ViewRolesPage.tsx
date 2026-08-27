import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Edit,
  Globe2,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import api from "@/api/api";

/* ============================================================
   TYPES
============================================================ */

type RoleType = "GLOBAL" | "TENANT";

interface RoleResponse {
  id: string;
  organizationId: string | null;
  roleName: string;
  roleCode: string;
  description: string | null;
  roleType: RoleType;
  systemRole: boolean;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/* ============================================================
   HELPERS
============================================================ */

function getApiMessage(error: any): string {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    "Something went wrong."
  );
}

/* ============================================================
   ROLE TYPE BADGE
============================================================ */

function RoleTypeBadge({
  roleType,
}: {
  roleType: RoleType;
}) {
  if (roleType === "GLOBAL") {
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
      <Building2 className="mr-1 h-3.5 w-3.5" />
      Tenant
    </Badge>
  );
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
   PAGE
============================================================ */

export default function ViewRolesPage() {
  const navigate = useNavigate();

  const { id } = useParams<{
    id: string;
  }>();

  const [role, setRole] = useState<RoleResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     LOAD ROLE
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError("Role ID is missing.");
      setIsLoading(false);
      return;
    }

    const loadRole = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get<
          ApiResponse<RoleResponse>
        >(`/api/v1/roles/${id}`);

        /*
         * IMPORTANT
         *
         * Backend response:
         *
         * {
         *   success: true,
         *   message: "Role fetched successfully.",
         *   data: {
         *      id: "...",
         *      organizationId: "...",
         *      roleName: "...",
         *      ...
         *   }
         * }
         *
         * Therefore the actual Role object is:
         *
         * response.data.data
         */

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch role."
          );
        }

        setRole(response.data.data);
      } catch (error) {
        setError(getApiMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    void loadRole();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async (): Promise<void> => {
    if (!role) {
      return;
    }

    if (role.systemRole) {
      setError("System roles cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete role "${role.roleName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.delete(`/api/v1/roles/${role.id}`);

      navigate("/roles");
    } catch (error) {
      setError(getApiMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-10">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading role...
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ==========================================================
     ERROR WITHOUT ROLE
  ========================================================== */

  if (error && !role) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Button
          variant="ghost"
          className="-ml-2 mb-4"
          onClick={() => navigate("/roles")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roles
        </Button>

        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  /* ==========================================================
     ROLE NOT FOUND
  ========================================================== */

  if (!role) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            Role not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20 p-4 sm:p-6">
      <div className=" w-full max-w-5xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-6">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-3"
            onClick={() => navigate("/roles")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* ROLE TITLE */}

            <div>
              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-semibold tracking-tight">
                  {role.roleName}
                </h1>

                <RoleTypeBadge
                  roleType={role.roleType}
                />

                <StatusBadge
                  active={role.active}
                  deleted={role.deleted}
                />

                {role.systemRole && (
                  <Badge variant="secondary">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    System Role
                  </Badge>
                )}

              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                View role information, scope and organization association.
              </p>
            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap gap-2">

              {!role.systemRole && !role.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/roles/${role.id}/edit`)
                  }
                  disabled={actionLoading}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              {!role.systemRole && !role.deleted && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}

                  Delete
                </Button>
              )}

            </div>
          </div>
        </div>

        {/* ====================================================
            ACTION ERROR
        ==================================================== */}

        {error && (
          <Alert
            variant="destructive"
            className="mb-6"
          >
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* ====================================================
            BASIC ROLE INFORMATION
        ==================================================== */}

        <Card className="mb-6">

          <CardHeader>
            <CardTitle>
              Role Information
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              {/* ROLE NAME */}

              <InfoItem
                label="Role Name"
                value={role.roleName}
              />

              {/* ROLE CODE */}

              <InfoItem
                label="Role Code"
                value={role.roleCode}
              />

              {/* ROLE TYPE */}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Role Type
                </p>

                <RoleTypeBadge
                  roleType={role.roleType}
                />
              </div>

              {/* STATUS */}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Status
                </p>

                <StatusBadge
                  active={role.active}
                  deleted={role.deleted}
                />
              </div>

              {/* SYSTEM ROLE */}

              <InfoItem
                label="System Role"
                value={role.systemRole ? "Yes" : "No"}
              />

              {/* ROLE ID */}

              <InfoItem
                label="Role ID"
                value={role.id}
              />

            </div>

          </CardContent>
        </Card>

        {/* ====================================================
            SCOPE & ORGANIZATION
        ==================================================== */}

        <Card className="mb-6">

          <CardHeader>
            <CardTitle>
              Scope & Organization
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              {/* SCOPE */}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Scope
                </p>

                {role.roleType === "GLOBAL" ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe2 className="h-4 w-4" />
                    Platform / Global
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    Organization / Tenant
                  </div>
                )}
              </div>

              {/* ORGANIZATION ID */}

              <InfoItem
                label="Organization ID"
                value={role.organizationId}
              />

            </div>

            {/* GLOBAL INFORMATION */}

            {role.roleType === "GLOBAL" && (
              <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">

                <div className="flex items-start gap-3">

                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <div>
                    <p className="font-medium text-foreground">
                      Global Role
                    </p>

                    <p className="mt-1">
                      This role is platform-level and is not associated
                      with any specific organization.
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* TENANT INFORMATION */}

            {role.roleType === "TENANT" && (
              <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">

                <div className="flex items-start gap-3">

                  <Building2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <div>

                    <p className="font-medium text-foreground">
                      Organization Role
                    </p>

                    <p className="mt-1">
                      This role belongs to the organization identified
                      above and is scoped to that tenant.
                    </p>

                  </div>

                </div>

              </div>
            )}

          </CardContent>
        </Card>

        {/* ====================================================
            DESCRIPTION
        ==================================================== */}

        <Card className="mb-6">

          <CardHeader>
            <CardTitle>
              Description
            </CardTitle>
          </CardHeader>

          <CardContent>

            <p className="whitespace-pre-wrap text-sm leading-6">
              {role.description || "No description provided."}
            </p>

          </CardContent>
        </Card>

        {/* ====================================================
            AUDIT INFORMATION
        ==================================================== */}

        <Card>

          <CardHeader>
            <CardTitle>
              Audit Information
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="grid gap-6 sm:grid-cols-2">

              {/* CREATED */}

              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">

                  <Calendar className="h-3.5 w-3.5" />

                  Created At

                </p>

                <p className="text-sm">
                  {role.createdAt
                    ? new Date(role.createdAt).toLocaleString()
                    : "Not available"}
                </p>
              </div>

              {/* UPDATED */}

              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">

                  <Clock className="h-3.5 w-3.5" />

                  Updated At

                </p>

                <p className="text-sm">
                  {role.updatedAt
                    ? new Date(role.updatedAt).toLocaleString()
                    : "Not available"}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}