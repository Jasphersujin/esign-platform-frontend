import {
  useEffect,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import * as z from "zod";

import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
} from "lucide-react";

import {
  useNavigate,
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

import {
  Textarea,
} from "@/components/ui/textarea";

/* ============================================================
   TYPES
============================================================ */

interface Organization {
  id: string;
  orgName?: string;
  active?: boolean;
  deleted?: boolean;
}

interface DepartmentFormValues {
  organizationId: string;
  departmentName: string;
  departmentCode: string;
  departmentType: string;
  description: string;
  active: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   SCHEMA
============================================================ */

const departmentSchema =
  z.object({
    organizationId: z
      .string()
      .min(
        1,
        "Organization is required"
      ),

    departmentName: z
      .string()
      .trim()
      .min(
        2,
        "Department name must be at least 2 characters"
      )
      .max(
        255,
        "Department name cannot exceed 255 characters"
      ),

    departmentCode: z
      .string()
      .trim()
      .min(
        1,
        "Department code is required"
      )
      .max(
        100,
        "Department code cannot exceed 100 characters"
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Department code can contain only letters, numbers, _ and -"
      ),

    departmentType: z
      .string(),

    description: z
      .string()
      .max(
        1000,
        "Description cannot exceed 1000 characters"
      ),

    active: z.boolean(),
  });

/* ============================================================
   TYPES
============================================================ */

const DEPARTMENT_TYPES = [
  {
    value: "HR",
    label: "Human Resources",
  },
  {
    value: "FINANCE",
    label: "Finance",
  },
  {
    value: "IT",
    label: "Information Technology",
  },
  {
    value: "OPERATIONS",
    label: "Operations",
  },
  {
    value: "SALES",
    label: "Sales",
  },
  {
    value: "MARKETING",
    label: "Marketing",
  },
  {
    value: "LEGAL",
    label: "Legal",
  },
  {
    value: "PROCUREMENT",
    label: "Procurement",
  },
  {
    value: "QUALITY",
    label: "Quality",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

/* ============================================================
   API
============================================================ */

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response = await api.get(
    "/api/v1/organizations?size=100"
  );

  const data = response.data?.data ??
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

export default function AddDepartmentPage(){
  const navigate = useNavigate();

  const [
    organizations,
    setOrganizations,
  ] = useState<Organization[]>(
    []
  );

  const [
    isLoadingOrganizations,
    setIsLoadingOrganizations,
  ] = useState<boolean>(
    true
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState<boolean>(
    false
  );

  const [
    submitError,
    setSubmitError,
  ] = useState<string>("");

  const form =
    useForm<DepartmentFormValues>(
      {
        resolver:
          zodResolver(
            departmentSchema
          ),

        defaultValues: {
          organizationId: "",
          departmentName: "",
          departmentCode: "",
          departmentType: "",
          description: "",
          active: true,
        },

        mode: "onBlur",

        reValidateMode:
          "onChange",
      }
    );

  /* ==========================================================
     LOAD ORGANIZATIONS
  ========================================================== */

  useEffect(() => {
    const loadOrganizations =
      async (): Promise<void> => {
        try {
          setIsLoadingOrganizations(
            true
          );

          const data =
            await fetchOrganizations();

          setOrganizations(
            data.filter(
              (
                organization: Organization
              ) =>
                organization.deleted !==
                  true &&
                organization.active !==
                  false
            )
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
          setIsLoadingOrganizations(
            false
          );
        }
      };

    void loadOrganizations();
  }, []);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: DepartmentFormValues
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        organizationId:
          values.organizationId,

        departmentName:
          values.departmentName.trim(),

        departmentCode:
          values.departmentCode
            .trim()
            .toUpperCase(),

        departmentType:
          values.departmentType.trim() ||
          null,

        description:
          values.description.trim() ||
          null,

        active: values.active,
      };

      await api.post(
        "/api/v1/departments",
        payload
      );

      navigate("/departments");
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
          "Failed to create department."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <h1 className="text-2xl font-semibold tracking-tight">
            Add Department
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a department and associate it with an organization.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="space-y-6"
        >

          {/* ORGANIZATION */}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <CardTitle>
                    Organization
                  </CardTitle>

                  <CardDescription>
                    Select the organization that owns this department.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Field>
                <FieldLabel>
                  Organization
                </FieldLabel>

                <Select
                  value={form.watch(
                    "organizationId"
                  )}
                  onValueChange={(
                    value: string
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
                    isLoadingOrganizations ||
                    isSubmitting
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingOrganizations
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
                            organization.orgName
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
            </CardContent>
          </Card>

          {/* DEPARTMENT */}

          <Card>
            <CardHeader>
              <CardTitle>
                Department Information
              </CardTitle>

              <CardDescription>
                Enter the department master information.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">

                <Field>
                  <FieldLabel>
                    Department Name *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "departmentName"
                    )}
                    placeholder="Human Resources"
                    disabled={
                      isSubmitting
                    }
                  />

                  <FieldError>
                    {
                      form.formState
                        .errors
                        .departmentName
                        ?.message
                    }
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel>
                    Department Code *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "departmentCode"
                    )}
                    placeholder="HR"
                    className="uppercase"
                    disabled={
                      isSubmitting
                    }
                  />

                  <FieldError>
                    {
                      form.formState
                        .errors
                        .departmentCode
                        ?.message
                    }
                  </FieldError>
                </Field>
              </div>

              <Field>
                <FieldLabel>
                  Department Type
                </FieldLabel>

                <Select
                  value={
                    form.watch(
                      "departmentType"
                    ) || "NONE"
                  }
                  onValueChange={(
                    value: string
                  ) =>
                    form.setValue(
                      "departmentType",
                      value ===
                        "NONE"
                        ? ""
                        : value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="NONE">
                      Not specified
                    </SelectItem>

                    {DEPARTMENT_TYPES.map(
                      (type) => (
                        <SelectItem
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>
                  Description
                </FieldLabel>

                <Textarea
                  {...form.register(
                    "description"
                  )}
                  rows={5}
                  placeholder="Department description..."
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
                    value: string
                  ) =>
                    form.setValue(
                      "active",
                      value ===
                        "ACTIVE"
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  "/departments"
                )
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

              Create Department
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}