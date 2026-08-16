import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Building2,
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

interface DepartmentResponse {
  id: string;
  organizationId: string;
  organizationName?: string;
  departmentName: string;
  departmentCode: string;
  departmentType?: string | null;
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

function formatDepartmentType(
  value?: string | null
): string {
  if (!value) {
    return "Not specified";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character: string) =>
        character.toUpperCase()
    );
}

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
    return "DP";
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

export default function ViewDepartmentPage() {
  const navigate = useNavigate();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    department,
    setDepartment,
  ] = useState<
    DepartmentResponse | null
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
        "Department ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const loadDepartment =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await api.get<DepartmentResponse>(
              `/api/v1/departments/${id}`
            );

          setDepartment(
            response.data
          );
        } catch (error) {
          const apiError =
            error as {
              response?: {
                data?: ApiErrorResponse;
              };
              message?: string;
            };

          setError(
            apiError.response?.data
              ?.message ??
              apiError.response?.data
                ?.error ??
              apiError.message ??
              "Failed to load department."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadDepartment();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!department) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete department "${department.departmentName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.delete(
          `/api/v1/departments/${department.id}`
        );

        navigate(
          "/departments"
        );
      } catch (error) {
        const apiError =
          error as {
            response?: {
              data?: ApiErrorResponse;
            };
            message?: string;
          };

        setError(
          apiError.response?.data
            ?.message ??
            apiError.response?.data
              ?.error ??
            "Failed to delete department."
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
      if (!department) {
        return;
      }

      const confirmed =
        window.confirm(
          `Restore department "${department.departmentName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await api.put(
          `/api/v1/departments/${department.id}/restore`
        );

        const response =
          await api.get<DepartmentResponse>(
            `/api/v1/departments/${department.id}`
          );

        setDepartment(
          response.data
        );
      } catch (error) {
        const apiError =
          error as {
            response?: {
              data?: ApiErrorResponse;
            };
            message?: string;
          };

        setError(
          apiError.response?.data
            ?.message ??
            apiError.response?.data
              ?.error ??
            "Failed to restore department."
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
            Loading department...
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
            navigate(
              "/departments"
            )
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Departments
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            Department not found.
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
              navigate(
                "/departments"
              )
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Departments
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Department Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View department information and organization association.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!department.deleted && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/departments/${department.id}/edit`
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

              {department.deleted ? (
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
                  department.departmentName
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-semibold">
                  {
                    department.departmentName
                  }
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Code:{" "}
                  <span className="font-medium text-foreground">
                    {
                      department.departmentCode
                    }
                  </span>
                </p>
              </div>

              <StatusBadge
                active={
                  department.active
                }
                deleted={
                  department.deleted
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* DEPARTMENT INFORMATION */}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Department Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Department Name"
                value={
                  department.departmentName
                }
              />

              <InfoItem
                label="Department Code"
                value={
                  department.departmentCode
                }
              />

              <InfoItem
                label="Department Type"
                value={formatDepartmentType(
                  department.departmentType
                )}
              />

              <InfoItem
                label="Version"
                value={
                  department.version
                }
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="Description"
                  value={
                    department.description ||
                    "No description provided"
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ORGANIZATION */}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Organization
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Organization Name
                </p>

                <p className="mt-1 break-words text-sm font-medium">
                  {
                    department.organizationName ??
                    "Not available"
                  }
                </p>

                <p className="mt-1 break-all text-xs text-muted-foreground">
                  ID:{" "}
                  {
                    department.organizationId
                  }
                </p>
              </div>

              {department.organizationId && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/organizations/${department.organizationId}`
                    )
                  }
                >
                  View Organization
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AUDIT */}

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
                      department.createdAt
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
                      department.updatedAt
                    )}
                  </p>
                </div>
              </div>

              <InfoItem
                label="Department ID"
                value={
                  department.id
                }
              />

              <InfoItem
                label="Organization ID"
                value={
                  department.organizationId
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}