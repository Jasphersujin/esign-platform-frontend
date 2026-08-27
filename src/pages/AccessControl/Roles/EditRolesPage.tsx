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
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
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

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import { Switch } from "@/components/ui/switch";
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

interface Organization {
  id: string;
  orgName?: string;
  organizationName?: string;
  active?: boolean;
  deleted?: boolean;
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
   SCHEMA
============================================================ */

const roleSchema = z
  .object({
    organizationId:
      z.string(),

    roleName: z
      .string()
      .trim()
      .min(
        2,
        "Role name must be at least 2 characters."
      )
      .max(
        100,
        "Role name cannot exceed 100 characters."
      ),

    roleCode: z
      .string()
      .trim()
      .min(
        2,
        "Role code is required."
      )
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
  .superRefine(
    (values, context) => {
      if (
        values.roleType ===
          "TENANT" &&
        !values.organizationId
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "organizationId",
          ],
          message:
            "Organization is required for Tenant Role.",
        });
      }

      if (
        values.roleType ===
          "GLOBAL" &&
        values.organizationId
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "organizationId",
          ],
          message:
            "Global roles cannot belong to an organization.",
        });
      }
    }
  );

/* ============================================================
   API
============================================================ */

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response =
    await api.get(
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

function getApiMessage(
  error: any
): string {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    "Something went wrong."
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function EditRolesPage() {
  const navigate = useNavigate();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    organizations,
    setOrganizations,
  ] = useState<Organization[]>(
    []
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const form =
    useForm<RoleFormValues>({
      resolver:
        zodResolver(roleSchema),

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
      reValidateMode:
        "onChange",
    });

  const roleType =
    form.watch("roleType");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setSubmitError(
        "Role ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const load =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setSubmitError("");

          const [
            roleResponse,
            organizationData,
          ] = await Promise.all([
            api.get<RoleResponse>(
              `/api/v1/roles/${id}`
            ),
            fetchOrganizations(),
          ]);

          const role =
            roleResponse.data;

          setOrganizations(
            organizationData.filter(
              (organization) =>
                organization.deleted !==
                  true &&
                organization.active !==
                  false
            )
          );

          form.reset({
            organizationId:
              role.organizationId ??
              "",

            roleName:
              role.roleName,

            roleCode:
              role.roleCode,

            description:
              role.description ??
              "",

            roleType:
              role.roleType,

            systemRole:
              role.systemRole,

            active:
              role.active,
          });
        } catch (error) {
          setSubmitError(
            getApiMessage(error)
          );
        } finally {
          setIsLoading(false);
        }
      };

    void load();
  }, [id, form]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: RoleFormValues
  ) => {
    if (!id) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        /*
         * Your current backend UpdateRoleRequestDTO
         * does not contain organizationId or systemRole.
         *
         * Therefore PUT must only send fields that the
         * current backend DTO actually accepts.
         */
        roleName:
          values.roleName.trim(),

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

      navigate(
        `/roles/${id}`
      );
    } catch (error) {
      setSubmitError(
        getApiMessage(error)
      );
    } finally {
      setIsSubmitting(false);
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
     PAGE
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl">

        <Button
          type="button"
          variant="ghost"
          className="-ml-2 mb-4"
          onClick={() =>
            navigate(
              `/roles/${id}`
            )
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Role
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              Edit Role
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Update the role configuration.
            </p>
          </CardHeader>

          <CardContent>

            {submitError && (
              <Alert
                variant="destructive"
                className="mb-6"
              >
                <AlertDescription>
                  {submitError}
                </AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={form.handleSubmit(
                onSubmit
              )}
              className="space-y-6"
            >

              {/* ROLE TYPE */}

              <div className="space-y-2">
                <Label>
                  Role Type
                </Label>

                <Controller
                  name="roleType"
                  control={form.control}
                  render={({
                    field,
                  }) => (
                    <Select
                      value={
                        field.value
                      }
                      onValueChange={(
                        value
                      ) => {
                        field.onChange(
                          value
                        );

                        if (
                          value ===
                          "GLOBAL"
                        ) {
                          form.setValue(
                            "organizationId",
                            ""
                          );
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="GLOBAL">
                          Global
                        </SelectItem>

                        <SelectItem value="TENANT">
                          Tenant
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* ORGANIZATION */}

              {roleType ===
                "TENANT" && (
                <div className="space-y-2">
                  <Label>
                    Organization
                  </Label>

                  <Controller
                    name="organizationId"
                    control={
                      form.control
                    }
                    render={({
                      field,
                    }) => (
                      <Select
                        value={
                          field.value
                        }
                        onValueChange={
                          field.onChange
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
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
                                {organization.orgName ??
                                  organization.organizationName ??
                                  organization.id}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {form.formState
                    .errors
                    .organizationId && (
                    <p className="text-sm text-destructive">
                      {
                        form
                          .formState
                          .errors
                          .organizationId
                          .message
                      }
                    </p>
                  )}
                </div>
              )}

              {/* ROLE NAME */}

              <div className="space-y-2">
                <Label>
                  Role Name
                </Label>

                <Input
                  {...form.register(
                    "roleName"
                  )}
                />

                {form.formState
                  .errors.roleName && (
                  <p className="text-sm text-destructive">
                    {
                      form
                        .formState
                        .errors
                        .roleName
                        .message
                    }
                  </p>
                )}
              </div>

              {/* ROLE CODE */}

              <div className="space-y-2">
                <Label>
                  Role Code
                </Label>

                <Input
                  {...form.register(
                    "roleCode"
                  )}
                  disabled
                />

                <p className="text-xs text-muted-foreground">
                  Role code is treated as the stable
                  identifier and is not editable by the
                  current backend update DTO.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="space-y-2">
                <Label>
                  Description
                </Label>

                <Textarea
                  {...form.register(
                    "description"
                  )}
                  rows={5}
                />

                {form.formState
                  .errors
                  .description && (
                  <p className="text-sm text-destructive">
                    {
                      form
                        .formState
                        .errors
                        .description
                        .message
                    }
                  </p>
                )}
              </div>

              {/* ACTIVE */}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>
                    Active
                  </Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Inactive roles cannot be used for
                    normal access.
                  </p>
                </div>

                <Controller
                  name="active"
                  control={
                    form.control
                  }
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
                    />
                  )}
                />
              </div>

              {/* SYSTEM ROLE */}

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div>
                  <Label>
                    System Role
                  </Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    System roles are protected by
                    the backend.
                  </p>
                </div>

                <Switch
                  checked={
                    form.watch(
                      "systemRole"
                    )
                  }
                  disabled
                />
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t pt-6">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/roles/${id}`
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
                    isSubmitting
                  }
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  Save Changes
                </Button>

              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}