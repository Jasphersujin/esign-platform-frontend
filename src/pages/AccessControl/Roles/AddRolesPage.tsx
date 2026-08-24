import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Building2,
  Globe2,
  Loader2,
  Save,
  Server,
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
          message: "Tenant is required for tenant-scoped roles",
        });
      }

      if (!values.organizationId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organizationId"],
          message: "Organization is required for tenant-scoped roles",
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

export default function AddRolesPage() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>(
    []
  );

  const [isLoadingData, setIsLoadingData] = useState(true);
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
     LOAD TENANTS + ORGANIZATIONS
  ========================================================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        const [tenantData, organizationData] = await Promise.all([
          fetchTenants(),
          fetchOrganizations(),
        ]);

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
            "Failed to load role configuration."
        );
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadData();
  }, []);

  /* ==========================================================
     SCOPE CHANGE
  ========================================================== */

  useEffect(() => {
    if (scopeType === "GLOBAL") {
      form.setValue("tenantId", "");
      form.setValue("organizationId", "");
    }
  }, [scopeType, form]);

  useEffect(() => {
    form.setValue("organizationId", "");
  }, [tenantId, form]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: RoleFormValues
  ): Promise<void> => {
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

      await api.post("/api/v1/roles", payload);

      navigate("/roles");
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
          "Failed to create role."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoadingData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading role configuration...
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
            onClick={() => navigate("/roles")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Add Role
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a global role or associate the role with a
            tenant and organization.
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

          {/* ROLE SCOPE */}

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
                    Choose whether this role is available globally
                    or belongs to a specific tenant.
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

              {scopeType === "GLOBAL" && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex gap-3">
                    <Globe2 className="mt-0.5 h-5 w-5 text-blue-600" />

                    <div>
                      <p className="text-sm font-medium">
                        Global Role
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        This role will not be associated with a
                        tenant or organization and can be used
                        globally.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                        <SelectValue
                          placeholder={
                            tenantId
                              ? "Select organization"
                              : "Select tenant first"
                          }
                        />
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
            </CardContent>
          </Card>

          {/* ROLE INFORMATION */}

          <Card>
            <CardHeader>
              <CardTitle>
                Role Information
              </CardTitle>

              <CardDescription>
                Enter the role master information.
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
                    placeholder="Manufacturing Admin"
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
                    placeholder="MANUFACTURING_ADMIN"
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
                  placeholder="Describe the responsibilities and access level of this role..."
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

          {/* ACTIONS */}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/roles")}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Role
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}