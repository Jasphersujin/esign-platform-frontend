import React, { useMemo, useState } from "react";

import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Columns3,
  Eye,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import api from "@/api/api";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Menu {
  id: string;
  displayName: string;
  icon?: string | null;
}

interface Screen {
  id: string;
  screenName: string;
  menuId: string;
  menuName?: string | null;
  menu?: Menu | null;
  screenCode: string;
  isDefault: boolean;
  description?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  version?: number;
}

interface ScreenPageResponse {
  content: Screen[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

interface ScreenFilters {
  active?: boolean;
  deleted?: boolean;
  menuId?: string;
  isDefault?: boolean;
}

type ViewMode = "table" | "list" | "card";
type Density = "comfortable" | "compact";

type ColumnKey =
  | "screen"
  | "menu"
  | "screenCode"
  | "default"
  | "status"
  | "created"
  | "updated"
  | "actions";

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = {
  screen: true,
  menu: true,
  screenCode: true,
  default: true,
  status: true,
  created: true,
  updated: false,
  actions: true,
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitials = (value: string): string => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "SC";
  }

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const ScreensPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState<string>("");

  const [page, setPage] = useState<number>(0);

  const [pageSize, setPageSize] = useState<number>(10);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("screens-view-mode");

    if (
      saved === "table" ||
      saved === "list" ||
      saved === "card"
    ) {
      return saved;
    }

    return "table";
  });

  const [density, setDensity] = useState<Density>(() => {
    const saved = localStorage.getItem("screens-density");

    if (saved === "comfortable" || saved === "compact") {
      return saved;
    }

    return "comfortable";
  });

  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColumnKey, boolean>>(() => {
      try {
        const saved = localStorage.getItem(
          "screens-visible-columns"
        );

        if (saved) {
          return {
            ...DEFAULT_VISIBLE_COLUMNS,
            ...JSON.parse(saved),
          };
        }
      } catch {
        // Ignore invalid localStorage value.
      }

      return DEFAULT_VISIBLE_COLUMNS;
    });

  const [filters, setFilters] = useState<ScreenFilters>({
    active: true,
    deleted: false,
  });

  const [filterSheetOpen, setFilterSheetOpen] =
    useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] =
    useState<Screen | null>(null);

  const [restoreTarget, setRestoreTarget] =
    useState<Screen | null>(null);

  const [actionLoading, setActionLoading] =
    useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  const updateViewMode = (mode: ViewMode): void => {
    setViewMode(mode);
    localStorage.setItem("screens-view-mode", mode);
  };

  const updateDensity = (value: Density): void => {
    setDensity(value);
    localStorage.setItem("screens-density", value);
  };

  const updateColumn = (
    column: ColumnKey,
    checked: boolean
  ): void => {
    const next = {
      ...visibleColumns,
      [column]: checked,
    };

    setVisibleColumns(next);

    localStorage.setItem(
      "screens-visible-columns",
      JSON.stringify(next)
    );
  };

  const queryKey = useMemo(
    () => [
      "screens",
      search,
      page,
      pageSize,
      filters,
    ],
    [search, page, pageSize, filters]
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ScreenPageResponse>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<ScreenPageResponse>(
        "/api/v1/screens/search",
        {
          params: {
            page,
            size: pageSize,
            search: search.trim() || undefined,
            active: filters.active,
            deleted: filters.deleted,
            menuId: filters.menuId || undefined,
            isDefault:
              filters.isDefault === undefined
                ? undefined
                : filters.isDefault,
            sortBy: "createdAt",
            sortDirection: "DESC",
          },
        }
      );

      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const screens = data?.content ?? [];

  const totalElements = data?.totalElements ?? 0;

  const totalPages = data?.totalPages ?? 0;

  const startItem =
    totalElements === 0 ? 0 : page * pageSize + 1;

  const endItem = Math.min(
    (page + 1) * pageSize,
    totalElements
  );

  const activeFilterCount =
    Number(filters.active !== undefined) +
    Number(filters.deleted !== undefined) +
    Number(filters.menuId !== undefined) +
    Number(filters.isDefault !== undefined);

  const resetFilters = (): void => {
    setFilters({
      active: true,
      deleted: false,
    });

    setPage(0);
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");

      await api.delete(
        `/api/v1/screens/${deleteTarget.id}`
      );

      setDeleteTarget(null);

      await queryClient.invalidateQueries({
        queryKey: ["screens"],
      });
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
        };
        message?: string;
      };

      setErrorMessage(
        apiError.response?.data?.message ??
          apiError.response?.data?.error ??
          apiError.message ??
          "Failed to delete screen."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (): Promise<void> => {
    if (!restoreTarget) {
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage("");

      await api.put(
        `/api/v1/screens/${restoreTarget.id}/restore`
      );

      setRestoreTarget(null);

      await queryClient.invalidateQueries({
        queryKey: ["screens"],
      });
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
        };
        message?: string;
      };

      setErrorMessage(
        apiError.response?.data?.message ??
          apiError.response?.data?.error ??
          apiError.message ??
          "Failed to restore screen."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatus = (screen: Screen) => {
    if (screen.deleted) {
      return (
        <Badge
          variant="outline"
          className="gap-1 text-muted-foreground"
        >
          <Trash2 className="h-3 w-3" />
          Deleted
        </Badge>
      );
    }

    if (screen.active) {
      return (
        <Badge
          variant="outline"
          className="gap-1 text-emerald-600"
        >
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="gap-1 text-muted-foreground"
      >
        <CircleOff className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const renderMenuName = (screen: Screen): string => {
    return (
      screen.menuName ??
      screen.menu?.displayName ??
      "-"
    );
  };

  const renderActions = (screen: Screen) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">
              Open actions
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            Actions
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() =>
              navigate(`/screens/${screen.id}`)
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>

          {!screen.deleted && (
            <DropdownMenuItem
              onClick={() =>
                navigate(
                  `/screens/${screen.id}/edit`
                )
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {screen.deleted ? (
            <DropdownMenuItem
              onClick={() =>
                setRestoreTarget(screen)
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() =>
                setDeleteTarget(screen)
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderScreenInfo = (screen: Screen) => {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
          {getInitials(screen.screenName)}
        </div>

        <div className="min-w-0">
          <button
            type="button"
            className="block max-w-full truncate text-left text-sm font-medium hover:underline"
            onClick={() =>
              navigate(`/screens/${screen.id}`)
            }
          >
            {screen.screenName}
          </button>

          {screen.description && (
            <p className="max-w-[280px] truncate text-xs text-muted-foreground">
              {screen.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderTable = () => {
    const rowPadding =
      density === "compact" ? "py-2" : "py-3";

    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.screen && (
                <TableHead className={rowPadding}>
                  Screen
                </TableHead>
              )}

              {visibleColumns.menu && (
                <TableHead className={rowPadding}>
                  Menu
                </TableHead>
              )}

              {visibleColumns.screenCode && (
                <TableHead className={rowPadding}>
                  Screen Code
                </TableHead>
              )}

              {visibleColumns.default && (
                <TableHead className={rowPadding}>
                  Default
                </TableHead>
              )}

              {visibleColumns.status && (
                <TableHead className={rowPadding}>
                  Status
                </TableHead>
              )}

              {visibleColumns.created && (
                <TableHead className={rowPadding}>
                  Created
                </TableHead>
              )}

              {visibleColumns.updated && (
                <TableHead className={rowPadding}>
                  Updated
                </TableHead>
              )}

              {visibleColumns.actions && (
                <TableHead className="w-[60px]" />
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading screens...
                  </div>
                </TableCell>
              </TableRow>
            ) : screens.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Archive className="mb-2 h-8 w-8 text-muted-foreground/50" />

                    <p className="text-sm font-medium">
                      No screens found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Try changing your search or filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              screens.map((screen) => (
                <TableRow
                  key={screen.id}
                  className={
                    screen.deleted
                      ? "opacity-60"
                      : undefined
                  }
                >
                  {visibleColumns.screen && (
                    <TableCell className={rowPadding}>
                      {renderScreenInfo(screen)}
                    </TableCell>
                  )}

                  {visibleColumns.menu && (
                    <TableCell className={rowPadding}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                          {getInitials(
                            renderMenuName(screen)
                          )}
                        </div>

                        <span className="max-w-[180px] truncate text-sm">
                          {renderMenuName(screen)}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.screenCode && (
                    <TableCell className={rowPadding}>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {screen.screenCode}
                      </code>
                    </TableCell>
                  )}

                  {visibleColumns.default && (
                    <TableCell className={rowPadding}>
                      {screen.isDefault ? (
                        <Badge
                          variant="secondary"
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Default
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No
                        </span>
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.status && (
                    <TableCell className={rowPadding}>
                      {renderStatus(screen)}
                    </TableCell>
                  )}

                  {visibleColumns.created && (
                    <TableCell
                      className={`${rowPadding} text-sm text-muted-foreground`}
                    >
                      {formatDate(screen.createdAt)}
                    </TableCell>
                  )}

                  {visibleColumns.updated && (
                    <TableCell
                      className={`${rowPadding} text-sm text-muted-foreground`}
                    >
                      {formatDate(screen.updatedAt)}
                    </TableCell>
                  )}

                  {visibleColumns.actions && (
                    <TableCell className={rowPadding}>
                      {renderActions(screen)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading screens...
            </CardContent>
          </Card>
        ) : screens.length === 0 ? (
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center">
              <Archive className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                No screens found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try changing your search or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          screens.map((screen) => (
            <Card
              key={screen.id}
              className={
                screen.deleted
                  ? "opacity-60"
                  : undefined
              }
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(screen.screenName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="truncate text-sm font-medium hover:underline"
                      onClick={() =>
                        navigate(
                          `/screens/${screen.id}`
                        )
                      }
                    >
                      {screen.screenName}
                    </button>

                    {screen.isDefault && (
                      <Badge
                        variant="secondary"
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Menu: {renderMenuName(screen)}
                    </span>

                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {screen.screenCode}
                    </code>

                    <span>
                      Created {formatDate(screen.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block">
                  {renderStatus(screen)}
                </div>

                {renderActions(screen)}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderCards = () => {
    if (isLoading) {
      return (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Loading screens...
        </div>
      );
    }

    if (screens.length === 0) {
      return (
        <Card className="col-span-full">
          <CardContent className="flex h-40 flex-col items-center justify-center">
            <Archive className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              No screens found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try changing your search or filters.
            </p>
          </CardContent>
        </Card>
      );
    }

    return screens.map((screen) => (
      <Card
        key={screen.id}
        className={
          screen.deleted ? "opacity-60" : undefined
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(screen.screenName)}
              </div>

              <div className="min-w-0">
                <CardTitle className="truncate text-base">
                  {screen.screenName}
                </CardTitle>

                <CardDescription className="mt-0.5 truncate">
                  {renderMenuName(screen)}
                </CardDescription>
              </div>
            </div>

            {renderActions(screen)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs">
              {screen.screenCode}
            </code>

            {screen.isDefault && (
              <Badge
                variant="secondary"
                className="gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Default
              </Badge>
            )}

            {renderStatus(screen)}
          </div>

          {screen.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {screen.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Created
              </p>

              <p className="mt-1 text-sm">
                {formatDate(screen.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Updated
              </p>

              <p className="mt-1 text-sm">
                {formatDate(screen.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Screens
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage application screens and their menu
              associations.
            </p>
          </div>

          <Button
            onClick={() => navigate("/screens/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Screen
          </Button>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{errorMessage}</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMessage("")}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Main Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>Screen Management</CardTitle>

                <CardDescription>
                  View, search, filter, and manage screens.
                </CardDescription>
              </div>

              {/* Search + Controls */}
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Search screens..."
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filters */}
                  <Sheet
                    open={filterSheetOpen}
                    onOpenChange={setFilterSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters

                        {activeFilterCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
                          >
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>

                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>
                          Filter Screens
                        </SheetTitle>

                        <SheetDescription>
                          Refine the screens displayed in
                          the list.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {/* Status */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium">
                            Status
                          </p>

                          <Select
                            value={
                              filters.deleted
                                ? "deleted"
                                : filters.active
                                ? "active"
                                : "inactive"
                            }
                            onValueChange={(value) => {
                              setPage(0);

                              if (value === "active") {
                                setFilters((prev) => ({
                                  ...prev,
                                  active: true,
                                  deleted: false,
                                }));
                              }

                              if (
                                value === "inactive"
                              ) {
                                setFilters((prev) => ({
                                  ...prev,
                                  active: false,
                                  deleted: false,
                                }));
                              }

                              if (
                                value === "deleted"
                              ) {
                                setFilters((prev) => ({
                                  ...prev,
                                  active: undefined,
                                  deleted: true,
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="active">
                                Active
                              </SelectItem>

                              <SelectItem value="inactive">
                                Inactive
                              </SelectItem>

                              <SelectItem value="deleted">
                                Deleted
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Default */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium">
                            Default Screen
                          </p>

                          <Select
                            value={
                              filters.isDefault ===
                              undefined
                                ? "all"
                                : filters.isDefault
                                ? "default"
                                : "non-default"
                            }
                            onValueChange={(value) => {
                              setPage(0);

                              setFilters((prev) => ({
                                ...prev,
                                isDefault:
                                  value === "all"
                                    ? undefined
                                    : value === "default",
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="all">
                                All Screens
                              </SelectItem>

                              <SelectItem value="default">
                                Default Only
                              </SelectItem>

                              <SelectItem value="non-default">
                                Non-default
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={resetFilters}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isFetching
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                  </Button>

                  {/* Columns */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="hidden gap-2 md:flex"
                      >
                        <Columns3 className="h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-52"
                    >
                      <DropdownMenuLabel>
                        Visible Columns
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator />

                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.screen}
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "screen",
                            checked
                          )
                        }
                      >
                        Screen
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.menu}
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "menu",
                            checked
                          )
                        }
                      >
                        Menu
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.screenCode
                        }
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "screenCode",
                            checked
                          )
                        }
                      >
                        Screen Code
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.default}
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "default",
                            checked
                          )
                        }
                      >
                        Default
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.status}
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "status",
                            checked
                          )
                        }
                      >
                        Status
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.created}
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "created",
                            checked
                          )
                        }
                      >
                        Created
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.updated}
                        onCheckedChange={(checked) =>
                          updateColumn(
                            "updated",
                            checked
                          )
                        }
                      >
                        Updated
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Density */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        Density
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() =>
                          updateDensity(
                            "comfortable"
                          )
                        }
                      >
                        Comfortable
                        {density ===
                          "comfortable" && (
                          <CheckCircle2 className="ml-auto h-4 w-4" />
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() =>
                          updateDensity("compact")
                        }
                      >
                        Compact
                        {density ===
                          "compact" && (
                          <CheckCircle2 className="ml-auto h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode */}
                  <div className="hidden items-center rounded-md border p-1 sm:flex">
                    <Button
                      type="button"
                      variant={
                        viewMode === "table"
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateViewMode("table")
                      }
                    >
                      <List className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant={
                        viewMode === "list"
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateViewMode("list")
                      }
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant={
                        viewMode === "card"
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateViewMode("card")
                      }
                    >
                      <Columns3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {viewMode === "table" &&
              renderTable()}

            {viewMode === "list" &&
              renderList()}

            {viewMode === "card" && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {renderCards()}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {startItem}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {endItem}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalElements}
                </span>{" "}
                screens
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    Rows
                  </span>

                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
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

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      page === 0 || isFetching
                    }
                    onClick={() =>
                      setPage((prev) =>
                        Math.max(0, prev - 1)
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="min-w-[70px] text-center text-xs text-muted-foreground">
                    Page {totalPages === 0 ? 0 : page + 1}{" "}
                    of {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      page >= totalPages - 1 ||
                      isFetching ||
                      totalPages === 0
                    }
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(
                          totalPages - 1,
                          prev + 1
                        )
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !actionLoading) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Screen?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.screenName}
              </span>
              ? The screen will be soft deleted and can
              be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={actionLoading}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={actionLoading}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(open) => {
          if (!open && !actionLoading) {
            setRestoreTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Restore Screen?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Restore{" "}
              <span className="font-medium text-foreground">
                {restoreTarget?.screenName}
              </span>
              ? The screen will become available again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={actionLoading}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={actionLoading}
              onClick={(event) => {
                event.preventDefault();
                void handleRestore();
              }}
            >
              {actionLoading && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScreensPage;