import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import * as z from "zod";

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

import { Textarea } from "@/components/ui/textarea";

/* ============================================================
   TYPES
============================================================ */

interface ActionResponse {
  id: string;
  name: string;
  actionCode: string;
  description?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  version?: number;
}

interface ActionFormValues {
  name: string;
  actionCode: string;
  description: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   SCHEMA
============================================================ */

const actionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Name must be at least 2 characters"
    )
    .max(
      255,
      "Name cannot exceed 255 characters"
    ),

  actionCode: z
    .string()
    .trim()
    .min(
      2,
      "Action code must be at least 2 characters"
    )
    .max(
      100,
      "Action code cannot exceed 100 characters"
    )
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Action code must contain uppercase letters, numbers, and underscores only"
    ),

  description: z
    .string()
    .max(
      1000,
      "Description cannot exceed 1000 characters"
    ),
});

/* ============================================================
   PAGE
============================================================ */

const EditActionPage = () => {
  const navigate =
    useNavigate();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const [submitError, setSubmitError] =
    useState<string>("");

  const form =
    useForm<ActionFormValues>({
      resolver:
        zodResolver(
          actionSchema
        ),

      defaultValues: {
        name: "",
        actionCode: "",
        description: "",
      },

      mode: "onBlur",

      reValidateMode:
        "onChange",
    });

  /* ==========================================================
     LOAD ACTION
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setSubmitError(
        "Action ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const loadAction =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setSubmitError("");

          const response =
            await api.get<ActionResponse>(
              `/api/v1/actions/${id}`
            );

          const action =
            response.data;

          form.reset({
            name:
              action.name ?? "",

            actionCode:
              action.actionCode ?? "",

            description:
              action.description ??
              "",
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
              "Failed to load action."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadAction();
  }, [id, form]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: ActionFormValues
  ): Promise<void> => {
    if (!id) {
      setSubmitError(
        "Action ID is missing."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        name:
          values.name.trim(),

        actionCode:
          values.actionCode
            .trim()
            .toUpperCase(),

        description:
          values.description
            .trim() || null,
      };

      await api.put(
        `/api/v1/actions/${id}`,
        payload
      );

      navigate(
        `/actions/${id}`
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
          "Failed to update action."
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
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading action...
          </p>

        </div>

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
              navigate("/actions")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Actions
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Action
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the action information and configuration.
          </p>

        </div>

        {/* ERROR */}

        {submitError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={
            form.handleSubmit(
              onSubmit
            )
          }
          className="space-y-6"
        >

          <Card>

            <CardHeader>

              <CardTitle>
                Action Information
              </CardTitle>

              <CardDescription>
                Update the basic information for this action.
              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-5">

              {/* NAME */}

              <Field>

                <FieldLabel>
                  Name *
                </FieldLabel>

                <Input
                  {...form.register(
                    "name"
                  )}
                  placeholder="Create User"
                  disabled={
                    isSubmitting
                  }
                />

                <FieldError>
                  {
                    form.formState
                      .errors
                      .name
                      ?.message
                  }
                </FieldError>

              </Field>

              {/* ACTION CODE */}

              <Field>

                <FieldLabel>
                  Action Code *
                </FieldLabel>

                <Input
                  {...form.register(
                    "actionCode"
                  )}
                  placeholder="CREATE_USER"
                  className="font-mono uppercase"
                  disabled={
                    isSubmitting
                  }
                  onChange={(
                    event
                  ) => {

                    const value =
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z0-9_]/g,
                          ""
                        );

                    form.setValue(
                      "actionCode",
                      value,
                      {
                        shouldValidate:
                          true,
                        shouldDirty:
                          true,
                      }
                    );
                  }}
                />

                <p className="text-xs text-muted-foreground">
                  Use uppercase letters, numbers, and underscores.
                </p>

                <FieldError>
                  {
                    form.formState
                      .errors
                      .actionCode
                      ?.message
                  }
                </FieldError>

              </Field>

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
                  placeholder="Enter action description..."
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

            </CardContent>

          </Card>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/actions/${id}`
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

              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Update Action

            </Button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default EditActionPage;