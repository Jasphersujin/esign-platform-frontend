import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  ArrowLeft,
  Building2,
  Globe2,
  Info,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "@/api/api";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

/* ============================================================
   TYPES
============================================================ */

type RoleType = "GLOBAL" | "TENANT";

interface Organization {
  id: string;
  orgName?: string;
  active?: boolean;
  deleted?: boolean;
}

interface RoleFormValues {
  roleType: RoleType | "";
  organizationId: string;
  roleName: string;
  roleCode: string;
  description: string;
  systemRole: boolean;
  active: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   SCHEMA
============================================================ */

const roleSchema = z
  .object({
    roleType: z
      .string()
      .min(1, "Role type is required"),

    organizationId: z.string(),

    roleName: z
      .string()
      .trim()
      .min(
        2,
        "Role name must be at least 2 characters"
      )
      .max(
        100,
        "Role name cannot exceed 100 characters"
      ),

    roleCode: z
      .string()
      .trim()
      .min(
        1,
        "Role code is required"
      )
      .max(
        50,
        "Role code cannot exceed 50 characters"
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Role code can contain only letters, numbers, _ and -"
      ),

    description: z
      .string()
      .max(
        500,
        "Description cannot exceed 500 characters"
      ),

    systemRole: z.boolean(),

    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    /*
     * TENANT roles must belong to an organization.
     */
    if (
      values.roleType === "TENANT" &&
      !values.organizationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message:
          "Organization is required for Tenant Role",
      });
    }

    /*
     * GLOBAL roles cannot belong to an organization.
     */
    if (
      values.roleType === "GLOBAL" &&
      values.organizationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message:
          "Global roles cannot belong to an organization",
      });
    }
  });

/* ============================================================
   API
============================================================ */

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response = await api.get(
    "/api/v1/organizations?size=100"
  );

  const data =
    response.data?.data ??
    response.data;

  return (
    data?.content ??
    data ??
    []
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function AddRolesPage() {
  const navigate = useNavigate();

  const [
    organizations,
    setOrganizations,
  ] = useState<Organization[]>([]);

  const [
    isLoadingOrganizations,
    setIsLoadingOrganizations,
  ] = useState<boolean>(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState<boolean>(false);

  const [
    submitError,
    setSubmitError,
  ] = useState<string>("");

  /* ==========================================================
     FORM
  ========================================================== */

  const form =
    useForm<RoleFormValues>({
      resolver:
        zodResolver(roleSchema),

      defaultValues: {
        roleType: "",
        organizationId: "",
        roleName: "",
        roleCode: "",
        description: "",
        systemRole: false,
        active: true,
      },

      mode: "onBlur",

      reValidateMode: "onChange",
    });

  const selectedRoleType =
    form.watch("roleType");

  const selectedOrganizationId =
    form.watch("organizationId");

  /* ==========================================================
     LOAD ORGANIZATIONS
  ========================================================== */

  useEffect(() => {
    const loadOrganizations =
      async (): Promise<void> => {
        try {
          setIsLoadingOrganizations(true);
          setSubmitError("");

          const data =
            await fetchOrganizations();

          const activeOrganizations =
            data.filter(
              (
                organization: Organization
              ) =>
                organization.deleted !== true &&
                organization.active !== false
            );

          setOrganizations(
            activeOrganizations
          );
        } catch (error) {
          const apiError =
            error as {
              response?: {
                data?: ApiErrorResponse;
              };
            };

          setSubmitError(
            apiError.response?.data
              ?.message ??
              apiError.response?.data
                ?.error ??
              "Failed to load organizations."
          );
        } finally {
          setIsLoadingOrganizations(false);
        }
      };

    void loadOrganizations();
  }, []);

  /* ==========================================================
     ROLE TYPE CHANGE
  ========================================================== */

  const handleRoleTypeChange = (
    value: string
  ) => {
    const roleType =
      value as RoleType;

    form.setValue(
      "roleType",
      roleType,
      {
        shouldValidate: true,
      }
    );

    /*
     * GLOBAL roles do not have an organization.
     */
    if (roleType === "GLOBAL") {
      form.setValue(
        "organizationId",
        "",
        {
          shouldValidate: true,
        }
      );
    }
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: RoleFormValues
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      /*
       * GLOBAL:
       * organizationId = null
       *
       * TENANT:
       * organizationId = selected UUID
       */
      const payload = {
        organizationId:
          values.roleType === "GLOBAL"
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

        systemRole:
          values.systemRole,

        active:
          values.active,
      };

      await api.post(
        "/api/v1/roles",
        payload
      );

      navigate("/roles");
    } catch (error) {
      const apiError =
        error as {
          response?: {
            data?: ApiErrorResponse;
          };
          message?: string;
        };

      setSubmitError(
        apiError.response?.data
          ?.message ??
          apiError.response?.data
            ?.error ??
          apiError.message ??
          "Failed to create role."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full max-w-5xl p-4 sm:p-6">

        {/* ====================================================
            HEADER
        ==================================================== */}

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

          <h1 className="text-2xl font-semibold tracking-tight">
            Add Role
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a global or organization-specific
            role and define its access scope.
          </p>

        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {submitError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit( onSubmit)}
          className="space-y-6"
        >

          {/* ==================================================
              ROLE SCOPE
          ================================================== */}

          <Card>

            <CardHeader>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>

                <div>

                  <CardTitle>
                    Role Scope
                  </CardTitle>

                  <CardDescription>
                    Define whether this role is global
                    or belongs to a specific organization.
                  </CardDescription>

                </div>

              </div>

            </CardHeader>

            <CardContent className="space-y-5">

              {/* ROLE TYPE */}

              <Field>

                <FieldLabel>
                  Role Type *
                </FieldLabel>

                <Select
                  value={
                    selectedRoleType ||
                    undefined
                  }
                  onValueChange={
                    handleRoleTypeChange
                  }
                  disabled={
                    isSubmitting
                  }
                >

                  <SelectTrigger>
                    <SelectValue placeholder="Select role type" />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="GLOBAL">

                      <div className="flex items-center gap-2">

                        <Globe2 className="h-4 w-4" />

                        <div>
                          <div>
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
                          <div>
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

                <FieldError>
                  {
                    form.formState
                      .errors
                      .roleType
                      ?.message
                  }
                </FieldError>

              </Field>

              {/* ORGANIZATION */}

              <Field>

                <FieldLabel>
                  Organization
                  {selectedRoleType ===
                    "TENANT" && " *"}
                </FieldLabel>

                <Select
                  value={
                    selectedOrganizationId ||
                    undefined
                  }
                  onValueChange={(
                    value
                  ) =>
                    form.setValue(
                      "organizationId",
                      value,
                      {
                        shouldValidate:
                          true,
                      }
                    )
                  }
                  disabled={
                    selectedRoleType !==
                      "TENANT" ||
                    isLoadingOrganizations ||
                    isSubmitting
                  }
                >

                  <SelectTrigger>

                    <SelectValue
                      placeholder={
                        selectedRoleType ===
                        "GLOBAL"
                          ? "Not applicable for Global role"
                          : isLoadingOrganizations
                          ? "Loading organizations..."
                          : "Select organization"
                      }
                    />

                  </SelectTrigger>

                  <SelectContent>

                    {organizations.map(
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
                          {
                            organization.orgName ??
                            organization.id
                          }
                        </SelectItem>
                      )
                    )}

                  </SelectContent>

                </Select>

                <FieldError>
                  {
                    form.formState
                      .errors
                      .organizationId
                      ?.message
                  }
                </FieldError>

              </Field>

              {/* SCOPE INFORMATION */}

              {selectedRoleType && (
                <div className="rounded-lg border bg-muted/30 p-4">

                  <div className="flex items-start gap-3">

                    {selectedRoleType ===
                    "GLOBAL" ? (
                      <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
                    )}

                    <div>

                      <p className="text-sm font-medium">
                        {selectedRoleType ===
                        "GLOBAL"
                          ? "Global Role"
                          : "Tenant Role"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">

                        {selectedRoleType ===
                        "GLOBAL"
                          ? "This role is available at the platform level and is not associated with a specific organization."
                          : "This role is scoped to the selected organization and is intended for users within that tenant."}

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
                Enter the basic information for this role.
              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-5">

              {/* NAME + CODE */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* ROLE NAME */}

                <Field>

                  <FieldLabel>
                    Role Name *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "roleName"
                    )}
                    placeholder="HR Admin"
                    disabled={
                      isSubmitting
                    }
                  />

                  <FieldError>
                    {
                      form.formState
                        .errors
                        .roleName
                        ?.message
                    }
                  </FieldError>

                </Field>

                {/* ROLE CODE */}

                <Field>

                  <FieldLabel>
                    Role Code *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "roleCode"
                    )}
                    placeholder="HR_ADMIN"
                    className="uppercase"
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) => {
                      event.target.value =
                        event.target.value.toUpperCase();

                      form.setValue(
                        "roleCode",
                        event.target.value,
                        {
                          shouldValidate:
                            true,
                        }
                      );
                    }}
                  />

                  <p className="text-xs text-muted-foreground">
                    Use a stable identifier such as HR_ADMIN or SUPPORT.
                  </p>

                  <FieldError>
                    {
                      form.formState
                        .errors
                        .roleCode
                        ?.message
                    }
                  </FieldError>

                </Field>

              </div>

              {/* DESCRIPTION */}

              <Field>

                <FieldLabel>
                  Description
                </FieldLabel>

                <Textarea
                  {...form.register(
                    "description"
                  )}
                  rows={5}
                  placeholder="Describe the purpose and responsibilities of this role..."
                  disabled={
                    isSubmitting
                  }
                />

                <FieldError>
                  {
                    form.formState
                      .errors
                      .description
                      ?.message
                  }
                </FieldError>

              </Field>

              {/* SYSTEM ROLE */}

              <Field>

                <FieldLabel>
                  System Role
                </FieldLabel>

                <Select
                  value={
                    form.watch(
                      "systemRole"
                    )
                      ? "TRUE"
                      : "FALSE"
                  }
                  onValueChange={(
                    value
                  ) =>
                    form.setValue(
                      "systemRole",
                      value ===
                        "TRUE",
                      {
                        shouldValidate:
                          true,
                      }
                    )
                  }
                  disabled={
                    isSubmitting
                  }
                >

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="FALSE">
                      No
                    </SelectItem>

                    <SelectItem value="TRUE">
                      Yes
                    </SelectItem>

                  </SelectContent>

                </Select>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">

                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                  <span>
                    System roles are protected from
                    normal modification and deletion.
                  </span>

                </div>

              </Field>

              {/* ACTIVE */}

              <Field>

                <FieldLabel>
                  Status
                </FieldLabel>

                <Select
                  value={
                    form.watch(
                      "active"
                    )
                      ? "ACTIVE"
                      : "INACTIVE"
                  }
                  onValueChange={(
                    value
                  ) =>
                    form.setValue(
                      "active",
                      value ===
                        "ACTIVE",
                      {
                        shouldValidate:
                          true,
                      }
                    )
                  }
                  disabled={
                    isSubmitting
                  }
                >

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="ACTIVE">
                      Active
                    </SelectItem>

                    <SelectItem value="INACTIVE">
                      Inactive
                    </SelectItem>

                  </SelectContent>

                </Select>

              </Field>

            </CardContent>

          </Card>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate("/roles")
              }
              disabled={
                isSubmitting
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingOrganizations
              }
            >

              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Create Role

            </Button>

          </div>

        </form>

      </div>
    </div>
  );
}