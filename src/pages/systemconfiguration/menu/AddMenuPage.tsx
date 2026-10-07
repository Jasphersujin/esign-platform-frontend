import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as LucideIcons from "lucide-react";

import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Save,
  Search,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createMenu } from "@/api/menu.api";
import { getSidebars } from "@/api/sidebar.api";

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
   TYPES
============================================================ */

interface SidebarOption {
  id: string;
  displayName?: string;
  sidebarName?: string;
  name?: string;
  active?: boolean;
}

/* ============================================================
   SCHEMA
============================================================ */

const menuSchema = z
  .object({
    menuName: z
      .string()
      .trim()
      .min(2, "Menu name must be at least 2 characters")
      .max(150, "Menu name cannot exceed 150 characters"),

    menuType: z.enum(["STANDALONE", "SIDEBAR"]),

    sidebarId: z.string().optional(),

    icon: z
      .string()
      .trim()
      .min(1, "Please select an icon")
      .max(150, "Icon cannot exceed 150 characters"),

    displayOrder: z
      .coerce
      .number()
      .int("Display order must be a whole number")
      .min(0, "Display order cannot be negative"),

    description: z
      .string()
      .max(5000, "Description cannot exceed 5000 characters"),
  })
  .superRefine((values, ctx) => {
    if (values.menuType === "SIDEBAR" && !values.sidebarId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sidebarId"],
        message: "Please select a sidebar",
      });
    }
  });

type FormValues = z.infer<typeof menuSchema>;

/* ============================================================
   HELPERS
============================================================ */

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };

  return (
    e.response?.data?.message ??
    e.response?.data?.error ??
    e.message ??
    fallback
  );
}

/* ============================================================
   ICON PREVIEW
============================================================ */

function IconPreview({ name }: { name: string }) {
  const Icon =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{ className?: string }>
      >
    )[name] ?? LucideIcons.Menu;

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-primary/5 text-primary">
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

const AddMenuPage = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [iconOpen, setIconOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebars, setSidebars] = useState<SidebarOption[]>([]);
  const [loadingSidebars, setLoadingSidebars] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(menuSchema),

    defaultValues: {
      menuName: "",
      menuType: "STANDALONE",
      sidebarId: "",
      icon: "Menu",
      displayOrder: 0,
      description: "",
    },

    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const selectedIcon = form.watch("icon");
  const menuType = form.watch("menuType");
  const selectedSidebarId = form.watch("sidebarId");

  /* ==========================================================
     LOAD SIDEBARS
  ========================================================== */

  useEffect(() => {
    if (menuType !== "SIDEBAR") {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingSidebars(true);

        const response = await getSidebars({
          search: sidebarSearch.trim() || undefined,
          active: true,
          page: 0,
          size: 100,
          sortBy: "displayOrder",
          sortDirection: "ASC",
        });

        setSidebars(response.content ?? []);
      } catch {
        setSidebars([]);
      } finally {
        setLoadingSidebars(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [sidebarSearch, menuType]);

  const selectedSidebar = useMemo(
    () =>
      sidebars.find(
        (sidebar) => sidebar.id === selectedSidebarId
      ),
    [sidebars, selectedSidebarId]
  );

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      setError("");

      await createMenu({
        menuName: values.menuName.trim(),

        sidebarId:
          values.menuType === "SIDEBAR"
            ? values.sidebarId || null
            : null,

        description:
          values.description.trim() || null,

        icon: values.icon.trim(),

        displayOrder: values.displayOrder,
      });

      navigate("/menus");
    } catch (e) {
      setError(
        getErrorMessage(
          e,
          "Failed to create menu."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full max-w-5xl p-4 sm:p-6">

        {/* Back */}
        <Button
          type="button"
          variant="ghost"
          className="-ml-2 mb-3"
          onClick={() => navigate("/menus")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menus
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Menu
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a standalone menu or link it to an existing sidebar.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* =====================================================
              BASIC INFORMATION
          ===================================================== */}

          <Card>
            <CardHeader>
              <CardTitle>Menu Details</CardTitle>
              <CardDescription>
                Configure the basic menu information.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* Menu Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Menu Name <span className="text-destructive">*</span>
                </label>

                <Input
                  placeholder="e.g. User Management"
                  {...form.register("menuName")}
                />

                {form.formState.errors.menuName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.menuName.message}
                  </p>
                )}
              </div>

              {/* Menu Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Menu Type <span className="text-destructive">*</span>
                </label>

                <Controller
                  name="menuType"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);

                        if (value === "STANDALONE") {
                          form.setValue("sidebarId", "");
                          setSidebarSearch("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select menu type" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="STANDALONE">
                          Standalone Menu
                        </SelectItem>

                        <SelectItem value="SIDEBAR">
                          Sidebar Menu
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Sidebar */}
              {menuType === "SIDEBAR" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Sidebar <span className="text-destructive">*</span>
                  </label>

                  <Popover
                    open={sidebarOpen}
                    onOpenChange={setSidebarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {selectedSidebar?.displayName ??
                            selectedSidebar?.sidebarName ??
                            selectedSidebar?.name ??
                            (selectedSidebarId ||
                              "Select sidebar")}
                        </span>

                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      className="w-[--radix-popover-trigger-width] p-0"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search sidebar..."
                          value={sidebarSearch}
                          onValueChange={setSidebarSearch}
                        />

                        <CommandList>
                          {loadingSidebars && (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}

                          {!loadingSidebars && (
                            <CommandEmpty>
                              No active sidebars found.
                            </CommandEmpty>
                          )}

                          {!loadingSidebars &&
                            sidebars.map((sidebar) => (
                              <CommandItem
                                key={sidebar.id}
                                value={sidebar.id}
                                onSelect={() => {
                                  form.setValue(
                                    "sidebarId",
                                    sidebar.id,
                                    {
                                      shouldValidate: true,
                                    }
                                  );

                                  setSidebarOpen(false);
                                  setSidebarSearch("");
                                }}
                              >
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium">
                                    {sidebar.displayName ??
                                      sidebar.sidebarName ??
                                      sidebar.name ??
                                      sidebar.id}
                                  </span>

                                  <span className="truncate text-xs text-muted-foreground">
                                    {sidebar.id}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {form.formState.errors.sidebarId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.sidebarId.message}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Select the sidebar under which this menu should appear.
                  </p>
                </div>
              )}

              {/* Icon + Display Order */}
              <div className="grid gap-6 md:grid-cols-2">

                {/* Icon */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Icon <span className="text-destructive">*</span>
                  </label>

                  <Popover
                    open={iconOpen}
                    onOpenChange={setIconOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <IconPreview name={selectedIcon} />
                          <span>{selectedIcon}</span>
                        </div>

                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      className="w-[320px] p-0"
                    >
                      <Command>
                        <CommandInput placeholder="Search icon..." />

                        <CommandList>
                          <CommandEmpty>
                            No icon found.
                          </CommandEmpty>

                          {ICON_NAMES.map((iconName) => {
                            const Icon =
                              (
                                LucideIcons as unknown as Record<
                                  string,
                                  React.ComponentType<{
                                    className?: string;
                                  }>
                                >
                              )[iconName] ??
                              LucideIcons.Menu;

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

                                  setIconOpen(false);
                                }}
                              >
                                <Icon className="mr-2 h-4 w-4" />
                                {iconName}
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {form.formState.errors.icon && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.icon.message}
                    </p>
                  )}
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Display Order{" "}
                    <span className="text-destructive">*</span>
                  </label>

                  <Input
                    type="number"
                    min={0}
                    {...form.register("displayOrder", {
                      valueAsNumber: true,
                    })}
                  />

                  {form.formState.errors.displayOrder && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.displayOrder
                          .message
                      }
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Lower values appear first.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description
                </label>

                <Textarea
                  rows={5}
                  placeholder="Describe the purpose of this menu..."
                  {...form.register("description")}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Optional</span>
                  <span>
                    {form.watch("description")?.length ?? 0}/5000
                  </span>
                </div>

                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* =====================================================
              ACTIONS
          ===================================================== */}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/menus")}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Menu
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMenuPage;