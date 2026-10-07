import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";

import * as LucideIcons from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  activateMenu,
  deactivateMenu,
  deleteMenu,
  getMenuById,
  type Menu,
} from "@/api/menu.api";

import api from "@/api/api";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

/* ============================================================
   TYPES
============================================================ */

interface SidebarResponse {
  id: string;
  displayName?: string;
  sidebarName?: string;
  name?: string;
}

/* ============================================================
   HELPERS
============================================================ */

function getErrorMessage(
  error: unknown,
  fallback: string
) {
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

function formatDateTime(
  value?: string
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  active,
  deleted,
}: {
  active: boolean;
  deleted: boolean;
}) {
  if (deleted) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/5 text-destructive"
      >
        Deleted
      </Badge>
    );
  }

  if (active) {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/5 text-green-600"
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-orange-500/30 bg-orange-500/5 text-orange-600"
    >
      Inactive
    </Badge>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>

      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="break-words text-sm">
        {value ?? "Not available"}
      </p>

    </div>
  );
}

/* ============================================================
   ICON
============================================================ */

function MenuIcon({
  iconName,
}: {
  iconName?: string | null;
}) {
  const Icon =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{
          className?: string;
        }>
      >
    )[iconName || "Menu"] ??
    LucideIcons.Menu;

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-7 w-7" />
    </div>
  );
}

/* ============================================================
   SIDEBAR NAME
============================================================ */

async function getSidebar(
  sidebarId: string
): Promise<SidebarResponse> {
  const response =
    await api.get<{
      success: boolean;
      message: string;
      data: SidebarResponse;
    }>(
      `/api/v1/sidebars/${sidebarId}`
    );

  return response.data.data;
}

/* ============================================================
   PAGE
============================================================ */

export default function ViewMenuPage() {
  const navigate = useNavigate();

  const { id } =
    useParams<{ id: string }>();

  const [menu, setMenu] =
    useState<Menu | null>(null);

  const [sidebar, setSidebar] =
    useState<SidebarResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError("Menu ID is missing.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const menuData =
          await getMenuById(id);

        setMenu(menuData);

        if (menuData.sidebarId) {
          try {
            const sidebarData =
              await getSidebar(
                menuData.sidebarId
              );

            setSidebar(
              sidebarData
            );
          } catch {
            setSidebar(null);
          }
        } else {
          setSidebar(null);
        }
      } catch (e) {
        setError(
          getErrorMessage(
            e,
            "Failed to load menu."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async () => {
    if (!menu) return;

    if (
      !window.confirm(
        `Delete menu "${menu.menuName}"?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await deleteMenu(menu.id);

      navigate("/menus");
    } catch (e) {
      setError(
        getErrorMessage(
          e,
          "Failed to delete menu."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ==========================================================
     ACTIVATE
  ========================================================== */

  const handleActivate = async () => {
    if (!menu) return;

    try {
      setActionLoading(true);
      setError("");

      await activateMenu(menu.id);

      setMenu({
        ...menu,
        active: true,
      });
    } catch (e) {
      setError(
        getErrorMessage(
          e,
          "Failed to activate menu."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ==========================================================
     DEACTIVATE
  ========================================================== */

  const handleDeactivate =
    async () => {
      if (!menu) return;

      if (
        !window.confirm(
          `Deactivate menu "${menu.menuName}"?`
        )
      ) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await deactivateMenu(
          menu.id
        );

        setMenu({
          ...menu,
          active: false,
        });
      } catch (e) {
        setError(
          getErrorMessage(
            e,
            "Failed to deactivate menu."
          )
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
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
     ERROR
  ========================================================== */

  if (error && !menu) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-6">

        <Button
          variant="ghost"
          className="-ml-2 mb-4"
          onClick={() =>
            navigate("/menus")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menus
        </Button>

        <Card>

          <CardContent className="p-6">

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>

          </CardContent>

        </Card>

      </div>
    );
  }

  if (!menu) {
    return null;
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="w-full min-w-0 space-y-5 p-4 sm:p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <Button
            variant="ghost"
            className="-ml-2 mb-2"
            onClick={() =>
              navigate("/menus")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menus
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Menu Details
          </h1>

          <p className="text-sm text-muted-foreground">
            View menu configuration and hierarchy.
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/menus/${menu.id}/edit`
              )
            }
            disabled={
              actionLoading
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          {menu.active ? (
            <Button
              variant="outline"
              onClick={
                handleDeactivate
              }
              disabled={
                actionLoading
              }
            >
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={
                handleActivate
              }
              disabled={
                actionLoading
              }
            >
              <Power className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              actionLoading
            }
          >
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}

            Delete
          </Button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* MAIN */}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

        {/* LEFT */}

        <div className="space-y-5">

          <Card>

            <CardHeader>

              <CardTitle>
                Menu Information
              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="flex items-start gap-4">

                <MenuIcon
                  iconName={
                    menu.icon
                  }
                />

                <div className="min-w-0">

                  <h2 className="text-xl font-semibold">
                    {menu.menuName}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {menu.icon ??
                      "Menu"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    <StatusBadge
                      active={
                        menu.active
                      }
                      deleted={
                        menu.deleted
                      }
                    />

                    {menu.sidebarId ? (
                      <Badge variant="secondary">
                        Sidebar Menu
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Standalone Menu
                      </Badge>
                    )}

                  </div>

                </div>

              </div>

            </CardContent>

          </Card>

          <Card>

            <CardHeader>

              <CardTitle>
                Configuration
              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="grid gap-6 sm:grid-cols-2">

                <div>
                  <InfoItem
                    label="Menu Name"
                    value={
                      menu.menuName
                    }
                  />
                </div>

                <div>
                  <InfoItem
                    label="Display Order"
                    value={
                      menu.displayOrder
                    }
                  />
                </div>

                <div>
                  <InfoItem
                    label="Menu Type"
                    value={
                      menu.sidebarId
                        ? "Sidebar Menu"
                        : "Standalone Menu"
                    }
                  />
                </div>

                <div>
                  <InfoItem
                    label="Icon"
                    value={
                      menu.icon
                    }
                  />
                </div>

                <div className="sm:col-span-2">

                  <InfoItem
                    label="Description"
                    value={
                      menu.description ||
                      "No description"
                    }
                  />

                </div>

              </div>

            </CardContent>

          </Card>

          <Card>

            <CardHeader>

              <CardTitle>
                Hierarchy
              </CardTitle>

            </CardHeader>

            <CardContent>

              {menu.sidebarId ? (
                <div className="rounded-lg border bg-muted/20 p-4">

                  <p className="text-xs font-medium text-muted-foreground">
                    Parent Sidebar
                  </p>

                  <p className="mt-1 font-medium">
                    {sidebar?.displayName ??
                      sidebar?.sidebarName ??
                      sidebar?.name ??
                      menu.sidebarId}
                  </p>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {menu.sidebarId}
                  </p>

                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 p-4">

                  <p className="font-medium">
                    Standalone Menu
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    This menu is not assigned to any sidebar.
                  </p>

                </div>
              )}

            </CardContent>

          </Card>

        </div>

        {/* RIGHT */}

        <div className="space-y-5">

          <Card>

            <CardHeader>

              <CardTitle>
                Audit Information
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-5">

              <div className="flex gap-3">

                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />

                <div>

                  <p className="text-xs font-medium text-muted-foreground">
                    Created
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDateTime(
                      menu.createdAt
                    )}
                  </p>

                </div>

              </div>

              <div className="flex gap-3">

                <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />

                <div>

                  <p className="text-xs font-medium text-muted-foreground">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDateTime(
                      menu.updatedAt
                    )}
                  </p>

                </div>

              </div>

              <InfoItem
                label="Created By"
                value={
                  menu.createdBy
                }
              />

              <InfoItem
                label="Updated By"
                value={
                  menu.updatedBy
                }
              />

              <InfoItem
                label="Version"
                value={
                  menu.version
                }
              />

            </CardContent>

          </Card>

          <Card>

            <CardHeader>

              <CardTitle>
                Menu ID
              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="break-all font-mono text-xs text-muted-foreground">
                {menu.id}
              </p>

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}