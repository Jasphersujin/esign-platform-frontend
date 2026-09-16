import React, { useEffect, useState } from "react";

import {
  Check,
  ChevronDown,
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

import * as LucideIcons from "lucide-react";

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/* ============================================================
   TYPES
============================================================ */

interface MenuResponse {
  id: string;
  displayName: string;
  icon: string;
  displayOrder: number;
  description?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

interface MenuFormValues {
  displayName: string;
  icon: string;
  displayOrder: number;
  description: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   ICONS
============================================================ */

const ICON_NAMES = [
  "LayoutDashboard",
  "Home",
  "Users",
  "User",
  "Settings",
  "Shield",
  "ShieldCheck",
  "Menu",
  "FileText",
  "Folder",
  "FolderOpen",
  "Database",
  "BarChart3",
  "PieChart",
  "LineChart",
  "Activity",
  "Bell",
  "Calendar",
  "Clock",
  "Search",
  "Building2",
  "Factory",
  "Package",
  "Boxes",
  "ShoppingCart",
  "CreditCard",
  "Wallet",
  "Briefcase",
  "ClipboardList",
  "CheckCircle2",
  "AlertCircle",
  "Info",
  "HelpCircle",
  "Globe",
  "Lock",
  "Key",
  "Mail",
  "MessageSquare",
  "Upload",
  "Download",
  "Eye",
  "Pencil",
  "Trash2",
  "Plus",
  "Layers",
  "Grid2X2",
  "Table2",
] as const;

/* ============================================================
   SCHEMA
============================================================ */

const menuSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(255, "Display name cannot exceed 255 characters"),

  icon: z
    .string()
    .trim()
    .min(1, "Please select an icon")
    .max(100, "Icon name cannot exceed 100 characters"),

  displayOrder: z
    .number()
    .int("Display order must be a whole number")
    .min(1, "Display order must be at least 1"),

  description: z
    .string()
    .max(
      1000,
      "Description cannot exceed 1000 characters"
    ),
});

/* ============================================================
   ICON PREVIEW
============================================================ */

function IconPreview({
  iconName,
}: {
  iconName: string;
}) {
  const IconComponent =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{
          className?: string;
        }>
      >
    )[iconName];

  if (!IconComponent) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted text-xs">
        ?
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-primary/5 text-primary">
      <IconComponent className="h-5 w-5" />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

const EditMenuPage = () => {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const [submitError, setSubmitError] =
    useState<string>("");

  const [iconPickerOpen, setIconPickerOpen] =
    useState<boolean>(false);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),

    defaultValues: {
      displayName: "",
      icon: "Menu",
      displayOrder: 1,
      description: "",
    },

    mode: "onBlur",

    reValidateMode: "onChange",
  });

  const selectedIcon = form.watch("icon");

  /* ==========================================================
     LOAD MENU
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setSubmitError("Menu ID is missing.");
      setIsLoading(false);
      return;
    }

    const loadMenu =
      async (): Promise<void> => {
        try {
          setIsLoading(true);
          setSubmitError("");

          const response =
            await api.get<MenuResponse>(
              `/api/v1/menus/${id}`
            );

          const menu =
            response.data;

          form.reset({
            displayName:
              menu.displayName,

            icon:
              menu.icon || "Menu",

            displayOrder:
              menu.displayOrder,

            description:
              menu.description ?? "",
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
              "Failed to load menu."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void loadMenu();
  }, [id, form]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: MenuFormValues
  ): Promise<void> => {
    if (!id) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        displayName:
          values.displayName.trim(),

        icon:
          values.icon.trim(),

        displayOrder:
          values.displayOrder,

        description:
          values.description.trim() || null,
      };

      await api.put(
        `/api/v1/menus/${id}`,
        payload
      );

      navigate(`/menus/${id}`);
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
          "Failed to update menu."
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
            Loading menu...
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
              navigate(`/menus/${id}`)
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Menu
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update menu information, icon, and display order.
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

          <Card>
            <CardHeader>
              <CardTitle>
                Menu Information
              </CardTitle>

              <CardDescription>
                Update the menu master information.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">

                {/* DISPLAY NAME */}

                <Field>
                  <FieldLabel>
                    Display Name *
                  </FieldLabel>

                  <Input
                    {...form.register("displayName")}
                    disabled={isSubmitting}
                  />

                  <FieldError>
                    {
                      form.formState.errors
                        .displayName?.message
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

              {/* ICON */}

              <Field>
                <FieldLabel>
                  Icon *
                </FieldLabel>

                <Popover
                  open={iconPickerOpen}
                  onOpenChange={setIconPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-3">
                        <IconPreview
                          iconName={selectedIcon}
                        />

                        <span>
                          {selectedIcon}
                        </span>
                      </div>

                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-[320px] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search icon..."
                      />

                      <CommandList>
                        <CommandEmpty>
                          No icon found.
                        </CommandEmpty>

                        {ICON_NAMES.map(
                          (iconName) => {
                            const IconComponent =
                              (
                                LucideIcons as unknown as Record<
                                  string,
                                  React.ComponentType<{
                                    className?: string;
                                  }>
                                >
                              )[iconName];

                            return (
                              <CommandItem
                                key={iconName}
                                value={iconName}
                                onSelect={() => {
                                  form.setValue(
                                    "icon",
                                    iconName,
                                    {
                                      shouldValidate: true,
                                    }
                                  );

                                  setIconPickerOpen(
                                    false
                                  );
                                }}
                              >
                                <IconComponent className="mr-3 h-4 w-4" />

                                {iconName}

                                {selectedIcon ===
                                  iconName && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            );
                          }
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <FieldError>
                  {form.formState.errors.icon?.message}
                </FieldError>
              </Field>

              {/* DESCRIPTION */}

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
                    form.formState.errors
                      .description?.message
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
                navigate(`/menus/${id}`)
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
};

export default EditMenuPage;