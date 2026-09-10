import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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

import { Textarea } from "@/components/ui/textarea";

/* ============================================================
   TYPES
============================================================ */

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
    .min(2, "Sidebar name must be at least 2 characters")
    .max(255, "Sidebar name cannot exceed 255 characters"),

  displayOrder: z
    .number()
    .int("Display order must be a whole number")
    .min(1, "Display order must be at least 1"),

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

const AddSidebarPage = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const [submitError, setSubmitError] =
    useState<string>("");

  const form = useForm<SidebarFormValues>({
    resolver: zodResolver(sidebarSchema),

    defaultValues: {
      sidebarName: "",
      displayOrder: 1,
      sidebarDescription: "",
    },

    mode: "onBlur",

    reValidateMode: "onChange",
  });

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: SidebarFormValues
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        sidebarName: values.sidebarName.trim(),

        displayOrder: values.displayOrder,

        sidebarDescription:
          values.sidebarDescription.trim() || null,
      };

      await api.post(
        "/api/v1/sidebars",
        payload
      );

      navigate("/sidebars");
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
          "Failed to create sidebar."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==========================================================
     UI
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
            onClick={() => navigate("/sidebars")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sidebars
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Add Sidebar
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a sidebar and define its display order and description.
          </p>
        </div>

        {/* ERROR */}

        {submitError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >

          {/* SIDEBAR INFORMATION */}

          <Card>
            <CardHeader>
              <CardTitle>
                Sidebar Information
              </CardTitle>

              <CardDescription>
                Enter the basic information for the sidebar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* SIDEBAR NAME + DISPLAY ORDER */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* SIDEBAR NAME */}

                <Field>
                  <FieldLabel>
                    Sidebar Name *
                  </FieldLabel>

                  <Input
                    {...form.register("sidebarName")}
                    placeholder="Dashboard"
                    disabled={isSubmitting}
                  />

                  <FieldError>
                    {
                      form.formState.errors
                        .sidebarName?.message
                    }
                  </FieldError>
                </Field>

                {/* DISPLAY ORDER */}

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
                    placeholder="1"
                    disabled={isSubmitting}
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
                  placeholder="Enter sidebar description..."
                  disabled={isSubmitting}
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
              onClick={() => navigate("/sidebars")}
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

              Create Sidebar
            </Button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default AddSidebarPage;