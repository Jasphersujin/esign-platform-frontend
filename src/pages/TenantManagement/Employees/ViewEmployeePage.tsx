import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";

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

interface EmployeeResponse {
  id: string;
  organizationId?: string | null;
  departmentId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  designation?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Organization {
  id: string;
  orgName?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Department {
  id: string;
  organizationId: string;
  departmentName: string;
  departmentCode: string;
  active: boolean;
  deleted: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}


/* ============================================================
   HELPERS
============================================================ */

function getFullName(
  employee: EmployeeResponse
): string {
  return [
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}


function getInitials(
  employee: EmployeeResponse
): string {
  const first =
    employee.firstName
      ?.charAt(0)
      .toUpperCase() ??
    "";

  const last =
    employee.lastName
      ?.charAt(0)
      .toUpperCase() ??
    "";

  return (
    `${first}${last}` ||
    "EM"
  );
}


function formatDateTime(
  value?: string
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


function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <Badge
        variant="outline"
        className="
          border-green-500/30
          bg-green-500/5
          text-green-600
        "
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="
        border-orange-500/30
        bg-orange-500/5
        text-orange-600
      "
    >
      Inactive
    </Badge>
  );
}


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

export default function ViewEmployeePage() {
  const navigate =
    useNavigate();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    employee,
    setEmployee,
  ] = useState<
    EmployeeResponse | null
  >(null);

  const [
    organization,
    setOrganization,
  ] = useState<
    Organization | null
  >(null);

  const [
    department,
    setDepartment,
  ] = useState<
    Department | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError(
        "Employee ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const load =
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const employeeResponse =
            await api.get(
              `/api/v1/employees/${id}`
            );

          const employeeData:
            EmployeeResponse =
            employeeResponse
              .data?.data ??
            employeeResponse.data;

          setEmployee(
            employeeData
          );


          /* ORGANIZATION */

          if (
            employeeData.organizationId
          ) {
            try {
              const organizationResponse =
                await api.get(
                  `/api/v1/organizations/${employeeData.organizationId}`
                );

              setOrganization(
                organizationResponse
                  .data?.data ??
                organizationResponse.data
              );
            } catch {
              setOrganization(
                null
              );
            }
          }


          /* DEPARTMENT */

          if (
            employeeData.departmentId
          ) {
            try {
              const departmentResponse =
                await api.get(
                  `/api/v1/departments/${employeeData.departmentId}`
                );

              setDepartment(
                departmentResponse
                  .data?.data ??
                departmentResponse.data
              );
            } catch {
              setDepartment(
                null
              );
            }
          }
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
              "Failed to load employee."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void load();
  }, [id]);


  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async () => {
      if (!employee) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete employee "${getFullName(
            employee
          )}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        setError("");

        await api.delete(
          `/api/v1/employees/${employee.id}`
        );

        navigate(
          "/employees"
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
            "Failed to delete employee."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };


  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          <p className="text-sm text-muted-foreground">
            Loading employee...
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
              "/employees"
            )
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }


  if (!employee) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            Employee not found.
          </CardContent>
        </Card>
      </div>
    );
  }


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full max-w-5xl p-4 sm:p-6">

        {/* HEADER */}

        <div className="mb-6">
          <Button
            variant="ghost"
            className="-ml-2 mb-3"
            onClick={() =>
              navigate(
                "/employees"
              )
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Employee Details
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View employee information and organizational assignment.
              </p>
            </div>

            <div className="flex gap-2">
              {employee.active && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/employees/${employee.id}/edit`
                    )
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Employee
                </Button>
              )}

              {employee.active && (
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
                  employee
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-semibold">
                  {
                    getFullName(
                      employee
                    )
                  }
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Employee Code:{" "}
                  <span className="font-medium text-foreground">
                    {
                      employee.employeeCode
                    }
                  </span>
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {
                    employee.designation ??
                    "No designation"
                  }
                </p>
              </div>

              <StatusBadge
                active={
                  employee.active
                }
              />
            </div>
          </CardContent>
        </Card>


        {/* EMPLOYEE INFORMATION */}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserRound className="h-5 w-5 text-primary" />
              </div>

              <CardTitle>
                Employee Information
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="First Name"
                value={
                  employee.firstName
                }
              />

              <InfoItem
                label="Last Name"
                value={
                  employee.lastName ||
                  "Not provided"
                }
              />

              <InfoItem
                label="Employee Code"
                value={
                  employee.employeeCode
                }
              />

              <InfoItem
                label="Designation"
                value={
                  employee.designation ||
                  "Not specified"
                }
              />

            </div>
          </CardContent>
        </Card>


        {/* CONTACT INFORMATION */}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>

              <CardTitle>
                Contact Information
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Email"
                value={
                  employee.email
                }
              />

              <InfoItem
                label="Phone Number"
                value={
                  employee.phoneNumber ||
                  "Not provided"
                }
              />

            </div>
          </CardContent>
        </Card>


        {/* ORGANIZATION */}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>

              <CardTitle>
                Organization Assignment
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <InfoItem
                label="Organization"
                value={
                  organization
                    ?.orgName ??
                  employee.organizationId ??
                  "Not assigned"
                }
              />

              <InfoItem
                label="Department"
                value={
                  department
                    ?.departmentName ??
                  employee.departmentId ??
                  "Not assigned"
                }
              />

              <InfoItem
                label="Department Code"
                value={
                  department
                    ?.departmentCode ??
                  "Not available"
                }
              />

              <InfoItem
                label="Organization ID"
                value={
                  employee.organizationId
                }
              />

            </div>
          </CardContent>
        </Card>


        {/* AUDIT INFORMATION */}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Record Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />

                <InfoItem
                  label="Created At"
                  value={formatDateTime(
                    employee.createdAt
                  )}
                />
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />

                <InfoItem
                  label="Updated At"
                  value={formatDateTime(
                    employee.updatedAt
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