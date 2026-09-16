import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  useForm,
  Controller,
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

import { Checkbox } from "@/components/ui/checkbox";

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

interface Menu {
  id: string;
  displayName: string;
  icon?: string;
  displayOrder?: number;
  description?: string | null;
  active: boolean;
  deleted: boolean;
}

interface MenuPageResponse {
  content: Menu[];
  totalElements: number;
  totalPages: number;
}

interface ScreenFormValues {
  screenName: string;
  menuId: string;
  screenCode: string;
  isDefault: boolean;
  description: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/* ============================================================
   SCHEMA
============================================================ */

const screenSchema = z.object({
  screenName: z
    .string()
    .trim()
    .min(
      2,
      "Screen name must be at least 2 characters"
    )
    .max(
      255,
      "Screen name cannot exceed 255 characters"
    ),

  menuId: z
    .string()
    .trim()
    .min(
      1,
      "Please select a menu"
    ),

  screenCode: z
    .string()
    .trim()
    .min(
      2,
      "Screen code must be at least 2 characters"
    )
    .max(
      100,
      "Screen code cannot exceed 100 characters"
    )
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Screen code must contain uppercase letters, numbers, and underscores only"
    ),

  isDefault: z.boolean(),

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

const AddScreenPage = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);

  const [isLoadingMenus, setIsLoadingMenus] =
    useState<boolean>(true);

  const [submitError, setSubmitError] =
    useState<string>("");

  const [menuError, setMenuError] =
    useState<string>("");

  const [menus, setMenus] =
    useState<Menu[]>([]);

  const [menuPickerOpen, setMenuPickerOpen] =
    useState<boolean>(false);

  const form = useForm<ScreenFormValues>({
    resolver: zodResolver(screenSchema),

    defaultValues: {
      screenName: "",
      menuId: "",
      screenCode: "",
      isDefault: false,
      description: "",
    },

    mode: "onBlur",

    reValidateMode: "onChange",
  });

  const selectedMenuId =
    form.watch("menuId");

  const selectedMenu =
    menus.find(
      (menu) =>
        menu.id === selectedMenuId
    );

  /* ==========================================================
     LOAD MENUS
  ========================================================== */

  useEffect(() => {
    const loadMenus =
      async (): Promise<void> => {
        try {
          setIsLoadingMenus(true);
          setMenuError("");

          const response =
            await api.get<MenuPageResponse>(
              "/api/v1/menus/search",
              {
                params: {
                  page: 0,
                  size: 100,
                  active: true,
                  includeDeleted: false,
                  sortBy: "displayOrder",
                  sortDirection: "ASC",
                },
              }
            );

          setMenus(
            response.data.content ?? []
          );
        } catch (error) {
          const apiError = error as {
            response?: {
              data?: ApiErrorResponse;
            };
            message?: string;
          };

          setMenuError(
            apiError.response?.data?.message ??
              apiError.response?.data?.error ??
              apiError.message ??
              "Failed to load menus."
          );
        } finally {
          setIsLoadingMenus(false);
        }
      };

    void loadMenus();
  }, []);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (
    values: ScreenFormValues
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        screenName:
          values.screenName.trim(),

        menuId:
          values.menuId,

        screenCode:
          values.screenCode
            .trim()
            .toUpperCase(),

        isDefault:
          values.isDefault,

        description:
          values.description.trim() ||
          null,
      };

      await api.post(
        "/api/v1/screens",
        payload
      );

      navigate("/screens");
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
          "Failed to create screen."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              navigate("/screens")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Screens
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Add Screen
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a screen and associate it with a menu.
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
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >

          {/* SCREEN INFORMATION */}

          <Card>
            <CardHeader>
              <CardTitle>
                Screen Information
              </CardTitle>

              <CardDescription>
                Enter the basic information and menu association for this screen.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* SCREEN NAME + SCREEN CODE */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* SCREEN NAME */}

                <Field>
                  <FieldLabel>
                    Screen Name *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "screenName"
                    )}
                    placeholder="User Management"
                    disabled={
                      isSubmitting
                    }
                  />

                  <FieldError>
                    {
                      form.formState.errors
                        .screenName?.message
                    }
                  </FieldError>
                </Field>

                {/* SCREEN CODE */}

                <Field>
                  <FieldLabel>
                    Screen Code *
                  </FieldLabel>

                  <Input
                    {...form.register(
                      "screenCode"
                    )}
                    placeholder="USER_MANAGEMENT"
                    className="font-mono uppercase"
                    disabled={
                      isSubmitting
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /[^A-Z0-9_]/g,
                            ""
                          );

                      form.setValue(
                        "screenCode",
                        value,
                        {
                          shouldValidate:
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
                      form.formState.errors
                        .screenCode?.message
                    }
                  </FieldError>
                </Field>

              </div>

              {/* MENU */}

              <Controller
                name="menuId"
                control={form.control}
                render={({ field }) => (
                  <Field>

                    <FieldLabel>
                      Menu *
                    </FieldLabel>

                    <Popover
                      open={
                        menuPickerOpen
                      }
                      onOpenChange={
                        setMenuPickerOpen
                      }
                    >

                      <PopoverTrigger
                        asChild
                      >
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          disabled={
                            isSubmitting ||
                            isLoadingMenus
                          }
                        >

                          <span
                            className={
                              selectedMenu
                                ? ""
                                : "text-muted-foreground"
                            }
                          >
                            {isLoadingMenus
                              ? "Loading menus..."
                              : selectedMenu
                              ? selectedMenu.displayName
                              : "Select a menu"}
                          </span>

                          <ChevronDown className="h-4 w-4 opacity-50" />

                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] min-w-[280px] p-0"
                        align="start"
                      >
                        <Command>

                          <CommandInput
                            placeholder="Search menu..."
                          />

                          <CommandList>

                            <CommandEmpty>
                              No menu found.
                            </CommandEmpty>

                            {menus.map(
                              (menu) => (
                                <CommandItem
                                  key={
                                    menu.id
                                  }
                                  value={
                                    menu.displayName
                                  }
                                  onSelect={() => {
                                    field.onChange(
                                      menu.id
                                    );

                                    setMenuPickerOpen(
                                      false
                                    );
                                  }}
                                >

                                  <div className="flex min-w-0 flex-1 items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                                      {menu.displayName
                                        .trim()
                                        .charAt(
                                          0
                                        )
                                        .toUpperCase()}
                                    </div>

                                    <div className="min-w-0">

                                      <p className="truncate text-sm font-medium">
                                        {
                                          menu.displayName
                                        }
                                      </p>

                                      {menu.icon && (
                                        <p className="text-xs text-muted-foreground">
                                          {
                                            menu.icon
                                          }
                                        </p>
                                      )}

                                    </div>

                                  </div>

                                  {field.value ===
                                    menu.id && (
                                    <Check className="ml-auto h-4 w-4" />
                                  )}

                                </CommandItem>
                              )
                            )}

                          </CommandList>

                        </Command>
                      </PopoverContent>

                    </Popover>

                    {menuError && (
                      <p className="text-sm text-destructive">
                        {menuError}
                      </p>
                    )}

                    <FieldError>
                      {
                        form.formState.errors
                          .menuId?.message
                      }
                    </FieldError>

                  </Field>
                )}
              />

              {/* DEFAULT */}

              <Controller
                name="isDefault"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">

                    <Checkbox
                      id="isDefault"
                      checked={
                        field.value
                      }
                      onCheckedChange={
                        field.onChange
                      }
                      disabled={
                        isSubmitting
                      }
                    />

                    <div className="grid gap-1">
                      <label
                        htmlFor="isDefault"
                        className="cursor-pointer text-sm font-medium"
                      >
                        Is Default
                      </label>

                      <p className="text-xs text-muted-foreground">
                        Mark this screen as the default screen for the selected menu.
                      </p>
                    </div>

                  </div>
                )}
              />

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
                  placeholder="Enter screen description..."
                  disabled={
                    isSubmitting
                  }
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
                navigate("/screens")
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
                isLoadingMenus
              }
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Create Screen
            </Button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default AddScreenPage;
