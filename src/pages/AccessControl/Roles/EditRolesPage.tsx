import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Globe2,
  Loader2,
  Save,
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

interface Tenant {
  id: string;
  tenantName?: string;
  name?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Organization {
  id: string;
  orgName?: string;
  name?: string;
  tenantId?: string;
  active?: boolean;
  deleted?: boolean;
}

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

interface RoleFormValues {
  roleName: string;
  roleCode: string;
  description: string;
  scopeType: "GLOBAL" | "TENANT";
  tenantId: string;
  organizationId: string;
  active: boolean;
}

/* ============================================================
   SCHEMA
============================================================ */

const roleSchema = z
  .object({
    roleName: z
      .string()
      .trim()
      .min(2, "Role name must be at least 2 characters")
      .max(255, "Role name cannot exceed 255 characters"),

    roleCode: z
      .string()
      .trim()
      .min(2, "Role code is required")
      .max(100, "Role code cannot exceed 100 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Role code can contain only letters, numbers, _ and -"
      ),

    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters"),

    scopeType: z.enum(["GLOBAL", "TENANT"]),

    tenantId: z.string(),

    organizationId: z.string(),

    active: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.scopeType === "TENANT") {
      if (!values.tenantId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tenantId"],
          message: "Tenant is required",
        });
      }

      if (!values.organizationId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organizationId"],
          message: "Organization is required",
        });
      }
    }
  });

/* ============================================================
   API
============================================================ */

async function fetchTenants(): Promise<Tenant[]> {
  const response = await api.get("/api/v1/tenants?size=100");

  const data = response.data?.data ?? response.data;

  return data?.content ?? data ?? [];
}

async function fetchOrganizations(): Promise<Organization[]> {
  const response = await api.get(
    "/api/v1/organizations?size=100"
  );

  const data = response.data?.data ?? response.data;

  return data?.content ?? data ?? [];
}

/* ============================================================
   PAGE
============================================================ */

export default function EditRolesPage() {
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [organizations, setOrganizations] = useState<
    Organization[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),

    defaultValues: {
      roleName: "",
      roleCode: "",
      description: "",
      scopeType: "GLOBAL",
      tenantId: "",
      organizationId: "",
      active: true,
    },

    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const scopeType = form.watch("scopeType");
  const tenantId = form.watch("tenantId");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setSubmitError("Role ID is missing.");
      setIsLoading(false);
      return;
    }

    const loadRole = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setSubmitError("");

        const [
          roleResponse,
          tenantData,
          organizationData,
        ] = await Promise.all([
          api.get<RoleResponse>(
            `/api/v1/roles/${id}`
          ),
          fetchTenants(),
          fetchOrganizations(),
        ]);

        const role = roleResponse.data;

        setTenants(
          tenantData.filter(
            (tenant) =>
              tenant.deleted !== true &&
              tenant.active !== false
          )
        );

        setOrganizations(
          organizationData.filter(
            (organization) =>
              organization.deleted !== true &&
              organization.active !== false
          )
        );

        form.reset({
          roleName: role.roleName,
          roleCode: role.roleCode,
          description: role.description ?? "",
          scopeType: role.scopeType ?? "GLOBAL",
          tenantId: role.tenantId ?? "",
          organizationId:
            role.organizationId ?? "",
          active: role.active,
        });
      } catch (error) {
        const apiError = error as {
          response?: {
            data?: ApiErrorResponse;
          };
          message?: string;
        };

        setSubmitError(
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
  }, [id, form]);

  /* ==========================================================
     GLOBAL SCOPE
  ========================================================== */

  useEffect(() => {
    if (scopeType === "GLOBAL") {
      form.setValue("tenantId", "");
      form.setValue("organizationId", "");
    }
  }, [scopeType, form]);

  useEffect(() => {
    if (scopeType === "TENANT") {
      form.setValue("organizationId", "");
    }
  }, [tenantId, scopeType, form]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: RoleFormValues
  ): Promise<void> => {
    if (!id) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        roleName: values.roleName.trim(),

        roleCode: values.roleCode
          .trim()
          .toUpperCase(),

        description:
          values.description.trim() || null,

        scopeType: values.scopeType,

        tenantId:
          values.scopeType === "TENANT"
            ? values.tenantId
            : null,

        organizationId:
          values.scopeType === "TENANT"
            ? values.organizationId
            : null,

        active: values.active,
      };

      await api.put(
        `/api/v1/roles/${id}`,
        payload
      );

      navigate(`/roles/${id}`);
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: ApiErrorResponse;
        };
        message?: string;
      };

      setSubmitError(
        apiError.response?.data?.message ??
          apiError.response?.data?.error ??
          apiError.message ??
          "Failed to update role."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const filteredOrganizations =
    tenantId
      ? organizations.filter(
          (organization) =>
            !organization.tenantId ||
            organization.tenantId === tenantId
        )
      : [];

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
              navigate(`/roles/${id}`)
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Role
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Role
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update role information and scope assignment.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >

          {/* SCOPE */}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe2 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <CardTitle>
                    Role Scope
                  </CardTitle>

                  <CardDescription>
                    Configure the scope in which this role is available.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">

              <Field>
                <FieldLabel>
                  Scope *
                </FieldLabel>

                <Select
                  value={scopeType}
                  onValueChange={(value) =>
                    form.setValue(
                      "scopeType",
                      value as "GLOBAL" | "TENANT",
                      {
                        shouldValidate: true,
                      }
                    )
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="GLOBAL">
                      Global
                    </SelectItem>

                    <SelectItem value="TENANT">
                      Tenant Specific
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {scopeType === "TENANT" && (
                <div className="grid gap-5 md:grid-cols-2">

                  <Field>
                    <FieldLabel>
                      Tenant *
                    </FieldLabel>

                    <Select
                      value={tenantId}
                      onValueChange={(value) =>
                        form.setValue(
                          "tenantId",
                          value,
                          {
                            shouldValidate: true,
                          }
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>

                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem
                            key={tenant.id}
                            value={tenant.id}
                          >
                            {tenant.tenantName ??
                              tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FieldError>
                      {
                        form.formState.errors.tenantId
                          ?.message
                      }
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel>
                      Organization *
                    </FieldLabel>

                    <Select
                      value={form.watch(
                        "organizationId"
                      )}
                      onValueChange={(value) =>
                        form.setValue(
                          "organizationId",
                          value,
                          {
                            shouldValidate: true,
                          }
                        )
                      }
                      disabled={
                        isSubmitting || !tenantId
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>

                      <SelectContent>
                        {filteredOrganizations.map(
                          (organization) => (
                            <SelectItem
                              key={organization.id}
                              value={organization.id}
                            >
                              {organization.orgName ??
                                organization.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    <FieldError>
                      {
                        form.formState.errors
                          .organizationId?.message
                      }
                    </FieldError>
                  </Field>

                </div>
              )}

              {scopeType === "GLOBAL" && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex gap-3">
                    <Globe2 className="h-5 w-5 text-blue-600" />

                    <div>
                      <p className="text-sm font-medium">
                        Global Role
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Tenant and organization assignment is
                        not required for global roles.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* ROLE INFORMATION */}

          <Card>
            <CardHeader>
              <CardTitle>
                Role Information
              </CardTitle>

              <CardDescription>
                Update the role master information.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">

                <Field>
                  <FieldLabel>
                    Role Name *
                  </FieldLabel>

                  <Input
                    {...form.register("roleName")}
                    disabled={isSubmitting}
                  />

                  <FieldError>
                    {
                      form.formState.errors.roleName
                        ?.message
                    }
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel>
                    Role Code *
                  </FieldLabel>

                  <Input
                    {...form.register("roleCode")}
                    className="uppercase"
                    disabled={isSubmitting}
                  />

                  <FieldError>
                    {
                      form.formState.errors.roleCode
                        ?.message
                    }
                  </FieldError>
                </Field>

              </div>

              <Field>
                <FieldLabel>
                  Description
                </FieldLabel>

                <Textarea
                  {...form.register("description")}
                  rows={5}
                  disabled={isSubmitting}
                />

                <FieldError>
                  {
                    form.formState.errors.description
                      ?.message
                  }
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>
                  Status
                </FieldLabel>

                <Select
                  value={
                    form.watch("active")
                      ? "ACTIVE"
                      : "INACTIVE"
                  }
                  onValueChange={(value) =>
                    form.setValue(
                      "active",
                      value === "ACTIVE"
                    )
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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/roles/${id}`)
              }
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Role
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}