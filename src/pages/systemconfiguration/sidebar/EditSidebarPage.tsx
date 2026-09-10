import React, { useEffect, useState } from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import * as z from "zod";

import {
  ArrowLeft,
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

import { Textarea } from "@/components/ui/textarea";

/* ============================================================
   TYPES
============================================================ */

interface SidebarResponse {
  id: string;
  sidebarName: string;
  displayOrder: number;
  sidebarDescription?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

interface SidebarFormValues {
  sidebarName: string;
  displayOrder: number;
  sidebarDescription: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   SCHEMA
============================================================ */

const sidebarSchema = z.object({
  sidebarName: z
    .string()
    .trim()
    .min(
      2,
      "Sidebar name must be at least 2 characters"
    )
    .max(
      255,
      "Sidebar name cannot exceed 255 characters"
    ),

  displayOrder: z
    .number()
    .int(
      "Display order must be a whole number"
    )
    .min(
      1,
      "Display order must be at least 1"
    ),

  sidebarDescription: z
    .string()
    .max(
      1000,
      "Sidebar description cannot exceed 1000 characters"
    ),
});

/* ============================================================
   PAGE
============================================================ */

export default function EditSidebarPage() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const [submitError, setSubmitError] =
    useState<string>("");

  const form =
    useForm<SidebarFormValues>({
      resolver: zodResolver(
        sidebarSchema
      ),

      defaultValues: {
        sidebarName: "",
        displayOrder: 1,
        sidebarDescription: "",
      },

      mode: "onBlur",

      reValidateMode: "onChange",
    });

  /* ==========================================================
     LOAD SIDEBAR
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setSubmitError(
        "Sidebar ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const loadSidebar =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setSubmitError("");

          const response =
            await api.get<SidebarResponse>(
              `/api/v1/sidebars/${id}`
            );

          const sidebar =
            response.data;

          form.reset({
            sidebarName:
              sidebar.sidebarName,

            displayOrder:
              sidebar.displayOrder,

            sidebarDescription:
              sidebar.sidebarDescription ??
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
              "Failed to load sidebar."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadSidebar();
  }, [id, form]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: SidebarFormValues
  ): Promise<void> => {
    if (!id) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        sidebarName:
          values.sidebarName.trim(),

        displayOrder:
          values.displayOrder,

        sidebarDescription:
          values.sidebarDescription.trim() ||
          null,
      };

      await api.put(
        `/api/v1/sidebars/${id}`,
        payload
      );

      navigate(
        `/sidebars/${id}`
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
          "Failed to update sidebar."
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
            Loading sidebar...
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
              navigate(
                `/sidebars/${id}`
              )
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sidebar
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Sidebar
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update sidebar information and display order.
          </p>

        </div>

        {/* ERROR */}

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

          {/* SIDEBAR INFORMATION */}

          <Card>

            <CardHeader>

              <CardTitle>
                Sidebar Information
              </CardTitle>

              <CardDescription>
                Update the sidebar master information.
              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-5">

              {/* NAME + ORDER */}

              <div className="grid gap-5 md:grid-cols-2">

                <Field>

                  <FieldLabel>
                    Sidebar Name *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "sidebarName"
                    )}
                    disabled={
                      isSubmitting
                    }
                  />

                  <FieldError>
                    {
                      form.formState.errors
                        .sidebarName?.message
                    }
                  </FieldError>

                </Field>

                <Field>

                  <FieldLabel>
                    Display Order *
                  </FieldLabel>

                  <Input
                    type="number"
                    min={1}
                    {...form.register(
                      "displayOrder",
                      {
                        valueAsNumber: true,
                      }
                    )}
                    disabled={
                      isSubmitting
                    }
                  />

                  <FieldError>
                    {
                      form.formState.errors
                        .displayOrder?.message
                    }
                  </FieldError>

                </Field>

              </div>

              {/* DESCRIPTION */}

              <Field>

                <FieldLabel>
                  Sidebar Description
                </FieldLabel>

                <Textarea
                  {...form.register(
                    "sidebarDescription"
                  )}
                  rows={5}
                  disabled={
                    isSubmitting
                  }
                />

                <FieldError>
                  {
                    form.formState.errors
                      .sidebarDescription?.message
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
                  `/sidebars/${id}`
                )
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Save Changes
            </Button>

          </div>

        </form>
      </div>
    </div>
  );
}