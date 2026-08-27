import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Controller,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ArrowLeft,
  Building2,
  Globe2,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Alert, AlertDescription } from "@/components/ui/alert";

import api from "@/api/api";

/* ============================================================
   TYPES
============================================================ */

type RoleType = "GLOBAL" | "TENANT";

interface Role {
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

interface Organization {
  id: string;
  orgName: string;
  active?: boolean;
  deleted?: boolean;
}

interface RoleApiResponse {
  success: boolean;
  message: string;
  data: Role;
}

interface OrganizationApiResponse {
  success: boolean;
  message?: string;
  data:
    | Organization[]
    | {
        content: Organization[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
        size?: number;
      };
}

interface RoleFormValues {
  organizationId: string;
  roleName: string;
  roleCode: string;
  description: string;
  roleType: RoleType;
  systemRole: boolean;
  active: boolean;
}

/* ============================================================
   VALIDATION
============================================================ */

const roleSchema = z
  .object({
    organizationId: z.string(),

    roleName: z
      .string()
      .trim()
      .min(2, "Role name must be at least 2 characters.")
      .max(
        100,
        "Role name cannot exceed 100 characters."
      ),

    roleCode: z
      .string()
      .trim()
      .min(2, "Role code is required.")
      .max(
        50,
        "Role code cannot exceed 50 characters."
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Role code can contain only letters, numbers, _ and -."
      ),

    description: z
      .string()
      .max(
        500,
        "Description cannot exceed 500 characters."
      ),

    roleType: z.enum([
      "GLOBAL",
      "TENANT",
    ]),

    systemRole: z.boolean(),

    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (
      values.roleType === "TENANT" &&
      !values.organizationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message:
          "Organization is required for Tenant Role.",
      });
    }

    if (
      values.roleType === "GLOBAL" &&
      values.organizationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message:
          "Global roles cannot belong to an organization.",
      });
    }
  });

/* ============================================================
   ERROR HELPER
============================================================ */

const getErrorMessage = (error: any) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong."
  );
};

/* ============================================================
   COMPONENT
============================================================ */

export default function EditRolesPage() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  /* ==========================================================
     STATE
  ========================================================== */

  const [role, setRole] =
    useState<Role | null>(null);

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [organizationsLoading, setOrganizationsLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     FORM
  ========================================================== */

  const form =
    useForm<RoleFormValues>({
      resolver: zodResolver(roleSchema),

      defaultValues: {
        organizationId: "",
        roleName: "",
        roleCode: "",
        description: "",
        roleType: "GLOBAL",
        systemRole: false,
        active: true,
      },

      mode: "onBlur",

      reValidateMode: "onChange",
    });

  const roleType =
    form.watch("roleType");

  const systemRole =
    form.watch("systemRole");

  /* ==========================================================
     LOAD ORGANIZATIONS
  ========================================================== */

  const loadOrganizations =
    async () => {
      try {
        setOrganizationsLoading(true);

        const response =
          await api.get<OrganizationApiResponse>(
            "/api/v1/organizations",
            {
              params: {
                page: 0,
                size: 100,
              },
            }
          );

        const responseData =
          response.data;

        let organizationList: Organization[] =
          [];

        /*
         * Case 1:
         *
         * data: [...]
         */

        if (
          Array.isArray(
            responseData.data
          )
        ) {
          organizationList =
            responseData.data;
        }

        /*
         * Case 2:
         *
         * data: {
         *   content: [...]
         * }
         */

        else if (
          responseData.data &&
          !Array.isArray(
            responseData.data
          )
        ) {
          organizationList =
            responseData.data.content ??
            [];
        }

        /*
         * Only active organizations.
         */

        const activeOrganizations =
          organizationList.filter(
            (organization) =>
              organization.deleted !== true &&
              organization.active !== false
          );

        setOrganizations(
          activeOrganizations
        );
      } catch (err) {
        console.error(
          "Failed to load organizations",
          err
        );

        setOrganizations([]);

        setError(
          getErrorMessage(err)
        );
      } finally {
        setOrganizationsLoading(false);
      }
    };

  /* ==========================================================
     LOAD ROLE
  ========================================================== */

  const loadRole =
    async () => {
      if (!id) {
        setError(
          "Role ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        setError("");

        const response =
          await api.get<RoleApiResponse>(
            `/api/v1/roles/${id}`
          );

        /*
         * VERY IMPORTANT
         *
         * Your backend response is:
         *
         * {
         *   success: true,
         *   message: "...",
         *   data: {
         *      id: "...",
         *      organizationId: "...",
         *      roleName: "...",
         *      ...
         *   }
         * }
         *
         * Therefore:
         *
         * response.data.data
         *
         * is the actual Role.
         */

        const roleData =
          response.data.data;

        if (!roleData) {
          throw new Error(
            "Role data was not returned by the server."
          );
        }

        setRole(roleData);

        /*
         * Map backend role -> form.
         */

        form.reset({
          organizationId:
            roleData.organizationId ??
            "",

          roleName:
            roleData.roleName ??
            "",

          roleCode:
            roleData.roleCode ??
            "",

          description:
            roleData.description ??
            "",

          roleType:
            roleData.roleType,

          systemRole:
            roleData.systemRole ??
            false,

          active:
            roleData.active ??
            true,
        });
      } catch (err) {
        console.error(
          "Failed to load role",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      return;
    }

    void loadRole();
    void loadOrganizations();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ==========================================================
     HANDLE ROLE TYPE
  ========================================================== */

  const handleRoleTypeChange = (
    value: RoleType
  ) => {
    form.setValue(
      "roleType",
      value,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );

    /*
     * Global role cannot have organization.
     */

    if (value === "GLOBAL") {
      form.setValue(
        "organizationId",
        "",
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    }
  };

  /* ==========================================================
     HANDLE ORGANIZATION
  ========================================================== */

  const handleOrganizationChange = (
    value: string
  ) => {
    form.setValue(
      "organizationId",
      value,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      values: RoleFormValues
    ) => {
      if (!id) {
        setError(
          "Role ID is missing."
        );

        return;
      }

      try {
        setSubmitting(true);

        setError("");

        /*
         * Build payload.
         *
         * GLOBAL:
         * organizationId = null
         *
         * TENANT:
         * organizationId = selected UUID
         */

        const payload = {
          organizationId:
            values.roleType ===
            "GLOBAL"
              ? null
              : values.organizationId,

          roleName:
            values.roleName.trim(),

          roleCode:
            values.roleCode
              .trim()
              .toUpperCase(),

          description:
            values.description.trim() ||
            null,

          roleType:
            values.roleType,

          active:
            values.active,
        };

        await api.put(
          `/api/v1/roles/${id}`,
          payload
        );

        /*
         * Go to details page after update.
         */

        navigate(
          `/roles/${id}`
        );
      } catch (err) {
        console.error(
          "Failed to update role",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="w-full min-w-0 bg-muted/20 p-4 sm:p-6">

        <Card className="mx-auto w-full max-w-4xl">

          <CardContent className="flex min-h-[420px] items-center justify-center">

            <div className="flex flex-col items-center gap-3">

              <Loader2 className="h-7 w-7 animate-spin" />

              <p className="text-sm text-muted-foreground">
                Loading role...
              </p>

            </div>

          </CardContent>

        </Card>

      </div>
    );
  }

  /* ==========================================================
     ERROR / ROLE NOT FOUND
  ========================================================== */

  if (!role) {
    return (
      <div className="w-full min-w-0 bg-muted/20 p-4 sm:p-6">

        <div className="mx-auto w-full max-w-4xl">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-4"
            onClick={() =>
              navigate("/roles")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />

            Back to Roles
          </Button>

          <Alert variant="destructive">
            <AlertDescription>
              {error ||
                "Role not found."}
            </AlertDescription>
          </Alert>

        </div>

      </div>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20 p-4 sm:p-6">

      <div className="mx-auto w-full max-w-4xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-6">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-3"
            onClick={() =>
              navigate(
                `/roles/${id}`
              )
            }
            disabled={submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />

            Back to Role
          </Button>

          <div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Edit Role
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Update role information,
              organization scope and status.
            </p>

          </div>

        </div>

        {/* ====================================================
            ERROR
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
            SYSTEM ROLE WARNING
        ==================================================== */}

        {systemRole && (
          <Alert className="mb-6">

            <ShieldCheck className="h-4 w-4" />

            <AlertDescription>
              This is a system role.
              System roles cannot be modified
              or deleted.
            </AlertDescription>

          </Alert>
        )}

        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={form.handleSubmit(
            handleSubmit
          )}
          className="space-y-6"
        >

          {/* ==================================================
              ROLE SCOPE
          ================================================== */}

          <Card>

            <CardHeader>

              <CardTitle>
                Role Scope
              </CardTitle>

              <CardDescription>
                Define whether this role is
                global or organization-specific.
              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-6">

              {/* ==============================================
                  ROLE TYPE
              ============================================== */}

              <div className="space-y-2">

                <Label>
                  Role Type
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Controller
                  name="roleType"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={
                        field.value
                      }
                      onValueChange={(
                        value
                      ) =>
                        handleRoleTypeChange(
                          value as RoleType
                        )
                      }
                      disabled={
                        submitting ||
                        systemRole
                      }
                    >

                      <SelectTrigger className="w-full">

                        <SelectValue placeholder="Select role type" />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="GLOBAL">

                          <div className="flex items-center gap-2">

                            <Globe2 className="h-4 w-4" />

                            <div>

                              <div className="font-medium">
                                Global
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Platform-wide role
                              </div>

                            </div>

                          </div>

                        </SelectItem>

                        <SelectItem value="TENANT">

                          <div className="flex items-center gap-2">

                            <Building2 className="h-4 w-4" />

                            <div>

                              <div className="font-medium">
                                Tenant
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Organization-specific role
                              </div>

                            </div>

                          </div>

                        </SelectItem>

                      </SelectContent>

                    </Select>
                  )}
                />

                {form.formState.errors.roleType && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors
                        .roleType.message
                    }
                  </p>
                )}

              </div>

              {/* ==============================================
                  ORGANIZATION DROPDOWN
              ============================================== */}

              {roleType === "TENANT" && (
                <div className="space-y-2">

                  <Label>
                    Organization
                    <span className="ml-1 text-destructive">
                      *
                    </span>
                  </Label>

                  <Controller
                    name="organizationId"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={
                          field.value ||
                          undefined
                        }
                        onValueChange={
                          handleOrganizationChange
                        }
                        disabled={
                          submitting ||
                          systemRole ||
                          organizationsLoading
                        }
                      >

                        <SelectTrigger className="w-full">

                          <SelectValue
                            placeholder={
                              organizationsLoading
                                ? "Loading organizations..."
                                : "Select organization"
                            }
                          />

                        </SelectTrigger>

                        <SelectContent>

                          {organizationsLoading ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">

                              <Loader2 className="h-4 w-4 animate-spin" />

                              Loading organizations...

                            </div>
                          ) : organizations.length ===
                            0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No organizations found.
                            </div>
                          ) : (
                            organizations.map(
                              (
                                organization
                              ) => (
                                <SelectItem
                                  key={
                                    organization.id
                                  }
                                  value={
                                    organization.id
                                  }
                                >
                                  {organization.orgName}
                                </SelectItem>
                              )
                            )
                          )}

                        </SelectContent>

                      </Select>
                    )}
                  />

                  {form.formState.errors
                    .organizationId && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors
                          .organizationId
                          .message
                      }
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Tenant roles are associated
                    with one organization.
                  </p>

                </div>
              )}

              {/* ==============================================
                  GLOBAL INFO
              ============================================== */}

              {roleType === "GLOBAL" && (
                <div className="rounded-lg border bg-muted/30 p-4">

                  <div className="flex items-start gap-3">

                    <Globe2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>

                      <p className="text-sm font-medium">
                        Global Role
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Global roles are not
                        associated with a specific
                        organization.
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </CardContent>

          </Card>

          {/* ==================================================
              ROLE INFORMATION
          ================================================== */}

          <Card>

            <CardHeader>

              <CardTitle>
                Role Information
              </CardTitle>

              <CardDescription>
                Update the role's basic information.
              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-6">

              {/* ==============================================
                  ROLE NAME
              ============================================== */}

              <div className="space-y-2">

                <Label>
                  Role Name
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  {...form.register(
                    "roleName"
                  )}
                  placeholder="e.g. HR Admin"
                  disabled={
                    submitting ||
                    systemRole
                  }
                />

                {form.formState.errors
                  .roleName && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors
                        .roleName.message
                    }
                  </p>
                )}

              </div>

              {/* ==============================================
                  ROLE CODE
              ============================================== */}

              <div className="space-y-2">

                <Label>
                  Role Code
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  {...form.register(
                    "roleCode"
                  )}
                  placeholder="e.g. HR_ADMIN"
                  className="font-mono uppercase"
                  disabled={
                    submitting ||
                    systemRole
                  }
                  onChange={(event) => {
                    form.setValue(
                      "roleCode",
                      event.target.value.toUpperCase(),
                      {
                        shouldDirty:
                          true,
                        shouldValidate:
                          true,
                      }
                    );
                  }}
                />

                {form.formState.errors
                  .roleCode && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors
                        .roleCode.message
                    }
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Stable identifier such as
                  SUPPORT, HR_ADMIN or
                  FACTORY_MANAGER.
                </p>

              </div>

              {/* ==============================================
                  DESCRIPTION
              ============================================== */}

              <div className="space-y-2">

                <Label>
                  Description
                </Label>

                <Textarea
                  {...form.register(
                    "description"
                  )}
                  placeholder="Describe this role..."
                  rows={5}
                  disabled={
                    submitting ||
                    systemRole
                  }
                />

                {form.formState.errors
                  .description && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors
                        .description.message
                    }
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Maximum 500 characters.
                </p>

              </div>

            </CardContent>

          </Card>

          {/* ==================================================
              STATUS
          ================================================== */}

          <Card>

            <CardHeader>

              <CardTitle>
                Role Status
              </CardTitle>

              <CardDescription>
                Control whether the role is active.
              </CardDescription>

            </CardHeader>

            <CardContent>

              <div className="flex items-center justify-between rounded-lg border p-4">

                <div>

                  <Label>
                    Active
                  </Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Inactive roles cannot be
                    assigned for normal access.
                  </p>

                </div>

                <Controller
                  name="active"
                  control={form.control}
                  render={({
                    field,
                  }) => (
                    <Switch
                      checked={
                        field.value
                      }
                      onCheckedChange={
                        field.onChange
                      }
                      disabled={
                        submitting ||
                        systemRole
                      }
                    />
                  )}
                />

              </div>

            </CardContent>

          </Card>

          {/* ==================================================
              SYSTEM INFORMATION
          ================================================== */}

          <Card>

            <CardHeader>

              <CardTitle>
                System Information
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              <div className="flex items-center justify-between rounded-lg border p-4">

                <div>

                  <Label>
                    System Role
                  </Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    System roles are protected
                    by the platform.
                  </p>

                </div>

                <Switch
                  checked={
                    systemRole
                  }
                  disabled
                />

              </div>

              <div className="rounded-lg border p-4">

                <p className="text-xs text-muted-foreground">
                  Role ID
                </p>

                <p className="mt-1 break-all font-mono text-xs">
                  {role.id}
                </p>

              </div>

            </CardContent>

          </Card>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/roles/${id}`
                )
              }
              disabled={
                submitting
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                submitting ||
                systemRole
              }
            >

              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />

                  Save Changes
                </>
              )}

            </Button>

          </div>

        </form>

      </div>

    </div>
  );
}