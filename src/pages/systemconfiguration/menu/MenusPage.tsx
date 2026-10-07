import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  activateMenu,
  deactivateMenu,
  deleteMenu,
  searchMenus,
  type Menu,
} from "@/api/menu.api";

import api from "@/api/api";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import * as LucideIcons from "lucide-react";

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

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface SidebarPageResponse {
  content: SidebarOption[];
}

/* ============================================================
   FILTERS
============================================================ */

type Status = "ACTIVE" | "INACTIVE" | "ALL";

type MenuType =
  | "ALL"
  | "STANDALONE"
  | "SIDEBAR";

interface Filters {
  search: string;
  status: Status;
  sidebarId: string;
  menuType: MenuType;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "ACTIVE",
  sidebarId: "",
  menuType: "ALL",
  sortBy: "displayOrder",
  sortDirection: "ASC",
};

/* ============================================================
   HELPERS
============================================================ */

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
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

function unwrap<T>(
  response: {
    data: T | ApiEnvelope<T>;
  }
): T {
  const value = response.data;

  if (
    value &&
    typeof value === "object" &&
    "data" in value
  ) {
    return (value as ApiEnvelope<T>).data;
  }

  return value as T;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* ============================================================
   ICON
============================================================ */

function DynamicIcon({
  name,
}: {
  name?: string | null;
}) {
  const Icon =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{
          className?: string;
        }>
      >
    )[name || "Menu"] ?? LucideIcons.Menu;

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/5 text-green-600"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
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
   SIDEBARS
============================================================ */

async function fetchSidebars(): Promise<
  SidebarOption[]
> {
  const response = await api.post<
    ApiEnvelope<SidebarPageResponse>
  >("/api/v1/sidebars/search", {
    search: null,
    active: true,
    page: 0,
    size: 100,
    sortBy: "displayOrder",
    sortDirection: "ASC",
  });

  const data = unwrap<
    SidebarPageResponse | SidebarOption[]
  >(response);

  return Array.isArray(data)
    ? data
    : data.content ?? [];
}

/* ============================================================
   PAGE
============================================================ */

const MenusPage = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] =
    useState(20);

  const [filters, setFilters] =
    useState<Filters>(DEFAULT_FILTERS);

  const [searchInput, setSearchInput] =
    useState("");

  const [error, setError] =
    useState("");

  /* ==========================================================
     SIDEBARS
  ========================================================== */

  const sidebarQuery = useQuery({
    queryKey: ["menu-sidebars"],

    queryFn: fetchSidebars,

    staleTime: 60_000,
  });

  /* ==========================================================
     MENUS
  ========================================================== */

  const menuQuery = useQuery({
    queryKey: [
      "menus",
      filters,
      page,
      pageSize,
    ],

    queryFn: () =>
      searchMenus({
        page,
        size: pageSize,

        search:
          filters.search || undefined,

        active:
          filters.status === "ACTIVE"
            ? true
            : filters.status === "INACTIVE"
              ? false
              : null,

        sidebarId:
          filters.sidebarId || null,

        standalone:
          filters.menuType === "STANDALONE"
            ? true
            : filters.menuType === "SIDEBAR"
              ? false
              : null,

        sortBy: filters.sortBy,

        sortDirection:
          filters.sortDirection,
      }),

    placeholderData: keepPreviousData,
  });

  const menus =
    menuQuery.data?.content ?? [];

  const totalElements =
    menuQuery.data?.totalElements ?? 0;

  const totalPages =
    menuQuery.data?.totalPages ?? 0;

  const sidebars =
    sidebarQuery.data ?? [];

  const sidebarMap = useMemo(
    () =>
      new Map(
        sidebars.map((sidebar) => [
          sidebar.id,
          sidebar.displayName ??
            sidebar.sidebarName ??
            sidebar.name ??
            sidebar.id,
        ])
      ),
    [sidebars]
  );

  /* ==========================================================
     SEARCH
  ========================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);

      setFilters((current) => ({
        ...current,
        search: searchInput.trim(),
      }));
    }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  /* ==========================================================
     ACTIONS
  ========================================================== */

  const runAction = async (
    menu: Menu,
    action:
      | "activate"
      | "deactivate"
      | "delete"
  ) => {
    const label =
      action === "activate"
        ? "activate"
        : action === "deactivate"
          ? "deactivate"
          : "delete";

    if (
      !window.confirm(
        `Are you sure you want to ${label} "${menu.menuName}"?`
      )
    ) {
      return;
    }

    try {
      setError("");

      if (action === "activate") {
        await activateMenu(menu.id);
      }

      if (action === "deactivate") {
        await deactivateMenu(menu.id);
      }

      if (action === "delete") {
        await deleteMenu(menu.id);
      }

      await queryClient.invalidateQueries({
        queryKey: ["menus"],
      });
    } catch (e) {
      setError(
        getErrorMessage(
          e,
          `Failed to ${label} menu.`
        )
      );
    }
  };

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const goPrevious = () => {
    if (page > 0) {
      setPage((current) => current - 1);
    }
  };

  const goNext = () => {
    if (page < totalPages - 1) {
      setPage((current) => current + 1);
    }
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="w-full min-w-0 space-y-5 p-4 sm:p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Menus
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage standalone menus and menus grouped under sidebars.
          </p>
        </div>

        <div className="flex gap-2">

          <Button
            variant="outline"
            onClick={() => menuQuery.refetch()}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                menuQuery.isFetching
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </Button>

          <Button
            onClick={() =>
              navigate("/menus/new")
            }
          >
            <Plus className="mr-2 h-4 w-4" />

            Add Menu
          </Button>

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">

          <span>{error}</span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setError("")}
          >
            <X className="h-4 w-4" />
          </Button>

        </div>
      )}

      {/* FILTERS */}

      <Card>
        <CardContent className="p-4">

          <div className="grid gap-3 lg:grid-cols-[1fr_160px_220px_180px_100px]">

            {/* SEARCH */}

            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(e.target.value)
                }
                placeholder="Search menus..."
                className="pl-9"
                maxLength={150}
              />

            </div>

            {/* STATUS */}

            <Select
              value={filters.status}
              onValueChange={(value) => {
                setPage(0);

                setFilters((current) => ({
                  ...current,
                  status: value as Status,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ACTIVE">
                  Active
                </SelectItem>

                <SelectItem value="INACTIVE">
                  Inactive
                </SelectItem>

                <SelectItem value="ALL">
                  All
                </SelectItem>
              </SelectContent>
            </Select>

            {/* SIDEBAR */}

            <Select
              value={
                filters.sidebarId || "ALL"
              }
              onValueChange={(value) => {
                setPage(0);

                setFilters((current) => ({
                  ...current,
                  sidebarId:
                    value === "ALL"
                      ? ""
                      : value,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sidebar" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="ALL">
                  All Sidebars
                </SelectItem>

                {sidebars.map((sidebar) => (
                  <SelectItem
                    key={sidebar.id}
                    value={sidebar.id}
                  >
                    {sidebar.displayName ??
                      sidebar.sidebarName ??
                      sidebar.name ??
                      sidebar.id}
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>

            {/* MENU TYPE */}

            <Select
              value={filters.menuType}
              onValueChange={(value) => {
                setPage(0);

                setFilters((current) => ({
                  ...current,
                  menuType:
                    value as MenuType,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Menu Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All Menus
                </SelectItem>

                <SelectItem value="STANDALONE">
                  Standalone
                </SelectItem>

                <SelectItem value="SIDEBAR">
                  Sidebar Linked
                </SelectItem>
              </SelectContent>
            </Select>

            {/* PAGE SIZE */}

            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPage(0);
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="10">
                  10
                </SelectItem>

                <SelectItem value="20">
                  20
                </SelectItem>

                <SelectItem value="50">
                  50
                </SelectItem>

                <SelectItem value="100">
                  100
                </SelectItem>
              </SelectContent>
            </Select>

          </div>

        </CardContent>
      </Card>

      {/* TABLE */}

      <Card>
        <CardContent className="p-0">

          {menuQuery.isLoading ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="flex flex-col items-center gap-3">

                <Loader2 className="h-7 w-7 animate-spin text-primary" />

                <p className="text-sm text-muted-foreground">
                  Loading menus...
                </p>

              </div>

            </div>
          ) : menus.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">

              <div className="mb-3 rounded-full bg-muted p-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>

              <p className="font-medium">
                No menus found
              </p>

              <p className="text-sm text-muted-foreground">
                Try changing your search or filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <Table>

                <TableHeader>
                  <TableRow>

                    <TableHead>
                      Menu
                    </TableHead>

                    <TableHead>
                      Type
                    </TableHead>

                    <TableHead>
                      Sidebar
                    </TableHead>

                    <TableHead>
                      Display Order
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Created
                    </TableHead>

                    <TableHead className="w-[70px]" />

                  </TableRow>
                </TableHeader>

                <TableBody>

                  {menus.map((menu) => {

                    const sidebarName =
                      menu.sidebarId
                        ? sidebarMap.get(
                            menu.sidebarId
                          ) ??
                          menu.sidebarId
                        : null;

                    return (
                      <TableRow key={menu.id}>

                        {/* MENU */}

                        <TableCell>

                          <div className="flex items-center gap-3">

                            <DynamicIcon
                              name={menu.icon}
                            />

                            <div className="min-w-0">

                              <p className="font-medium">
                                {menu.menuName}
                              </p>

                              {menu.description && (
                                <p className="max-w-[320px] truncate text-xs text-muted-foreground">
                                  {menu.description}
                                </p>
                              )}

                            </div>

                          </div>

                        </TableCell>

                        {/* TYPE */}

                        <TableCell>

                          {menu.sidebarId ? (
                            <Badge variant="secondary">
                              Sidebar
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Standalone
                            </Badge>
                          )}

                        </TableCell>

                        {/* SIDEBAR */}

                        <TableCell>
                          {sidebarName ?? (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* ORDER */}

                        <TableCell>
                          {menu.displayOrder}
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <StatusBadge
                            active={menu.active}
                          />
                        </TableCell>

                        {/* CREATED */}

                        <TableCell>
                          {formatDate(
                            menu.createdAt
                          )}
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>

                          <DropdownMenu>

                            <DropdownMenuTrigger
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">

                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/menus/${menu.id}`
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/menus/${menu.id}/edit`
                                  )
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {menu.active ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(
                                      menu,
                                      "deactivate"
                                    )
                                  }
                                >
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(
                                      menu,
                                      "activate"
                                    )
                                  }
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  runAction(
                                    menu,
                                    "delete"
                                  )
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>

                            </DropdownMenuContent>

                          </DropdownMenu>

                        </TableCell>

                      </TableRow>
                    );
                  })}

                </TableBody>

              </Table>

            </div>
          )}

        </CardContent>
      </Card>

      {/* PAGINATION */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm text-muted-foreground">
          Showing{" "}
          {totalElements === 0
            ? 0
            : page * pageSize + 1}{" "}
          -{" "}
          {Math.min(
            (page + 1) * pageSize,
            totalElements
          )}{" "}
          of {totalElements}
        </p>

        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="sm"
            disabled={
              page === 0 ||
              menuQuery.isFetching
            }
            onClick={goPrevious}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {totalPages === 0 ? 0 : page + 1} of{" "}
            {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={
              page >= totalPages - 1 ||
              menuQuery.isFetching
            }
            onClick={goNext}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>

        </div>

      </div>

    </div>
  );
};

export default MenusPage;