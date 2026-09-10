import {
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
  Columns3,
  Eye,
  Grid2X2,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";
;

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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/api/api";

/* ============================================================
   TYPES
============================================================ */

interface Sidebar {
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

interface SidebarPageResponse {
  content: Sidebar[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface SidebarFilters {
  search: string;
  sidebarName: string;
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "DELETED"
    | "ALL";
  includeDeleted: boolean;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

type ViewMode =
  | "table"
  | "list"
  | "card";

type Density =
  | "comfortable"
  | "standard"
  | "compact";

interface VisibleColumns {
  sidebar: boolean;
  displayOrder: boolean;
  description: boolean;
  status: boolean;
  created: boolean;
  updated: boolean;
}

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_FILTERS: SidebarFilters = {
  search: "",
  sidebarName: "",
  status: "ACTIVE",
  includeDeleted: false,
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
  sortBy: "createdAt",
  sortDirection: "DESC",
};

const DEFAULT_COLUMNS: VisibleColumns = {
  sidebar: true,
  displayOrder: true,
  description: true,
  status: true,
  created: true,
  updated: false,
};

/* ============================================================
   HELPERS
============================================================ */

function formatDate(
  value?: string
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getInitials(
  value?: string
): string {
  if (!value) {
    return "SB";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase()
    )
    .join("");
}

/* ============================================================
   API
============================================================ */

async function fetchSidebars(
  filters: SidebarFilters,
  page: number,
  size: number
): Promise<SidebarPageResponse> {
  const params = new URLSearchParams();

  params.set(
    "page",
    String(page)
  );

  params.set(
    "size",
    String(size)
  );

  if (filters.search.trim()) {
    params.set(
      "search",
      filters.search.trim()
    );
  }

  if (filters.sidebarName.trim()) {
    params.set(
      "sidebarName",
      filters.sidebarName.trim()
    );
  }

  if (filters.status === "ACTIVE") {
    params.set(
      "active",
      "true"
    );
  }

  if (filters.status === "INACTIVE") {
    params.set(
      "active",
      "false"
    );
  }

  if (filters.status === "DELETED") {
    params.set(
      "deleted",
      "true"
    );

    params.set(
      "includeDeleted",
      "true"
    );
  }

  if (filters.status === "ALL") {
    params.set(
      "includeDeleted",
      "true"
    );
  }

  if (filters.includeDeleted) {
    params.set(
      "includeDeleted",
      "true"
    );
  }

  if (filters.createdFrom) {
    params.set(
      "createdFrom",
      filters.createdFrom
    );
  }

  if (filters.createdTo) {
    params.set(
      "createdTo",
      filters.createdTo
    );
  }

  if (filters.updatedFrom) {
    params.set(
      "updatedFrom",
      filters.updatedFrom
    );
  }

  if (filters.updatedTo) {
    params.set(
      "updatedTo",
      filters.updatedTo
    );
  }

  params.set(
    "sortBy",
    filters.sortBy
  );

  params.set(
    "sortDirection",
    filters.sortDirection
  );

  const response =
    await api.get<SidebarPageResponse>(
      `/api/v1/sidebars/search?${params.toString()}`
    );

  return response.data;
}

/* ============================================================
   STATUS BADGE
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
   ACTION MENU
============================================================ */

interface SidebarActionsProps {
  sidebar: Sidebar;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

function SidebarActions({
  sidebar,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: SidebarActionsProps) {
  return (
    <DropdownMenu>

      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44"
      >

        <DropdownMenuItem
          onClick={onView}
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>

        {!sidebar.deleted && (
          <DropdownMenuItem
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {sidebar.deleted ? (
          <DropdownMenuItem
            onClick={onRestore}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}

      </DropdownMenuContent>

    </DropdownMenu>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function SidebarPage() {
  const navigate = useNavigate();

  const queryClient =
    useQueryClient();

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    searchInput,
    setSearchInput,
  ] = useState<string>("");

  const [
    filters,
    setFilters,
  ] = useState<SidebarFilters>(
    DEFAULT_FILTERS
  );

  const [
    draftFilters,
    setDraftFilters,
  ] = useState<SidebarFilters>(
    DEFAULT_FILTERS
  );

  const [
    filterOpen,
    setFilterOpen,
  ] = useState<boolean>(false);

  const [
    page,
    setPage,
  ] = useState<number>(0);

  const [
    pageSize,
    setPageSize,
  ] = useState<number>(20);

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>("table");

  const [
    density,
    setDensity,
  ] = useState<Density>("standard");

  const [
    visibleColumns,
    setVisibleColumns,
  ] = useState<VisibleColumns>(
    DEFAULT_COLUMNS
  );

  const [
    actionError,
    setActionError,
  ] = useState<string>("");

  /* ==========================================================
     LOCAL STORAGE
  ========================================================== */

  useEffect(() => {
    const savedView =
      localStorage.getItem(
        "sidebars-view"
      );

    if (
      savedView === "table" ||
      savedView === "list" ||
      savedView === "card"
    ) {
      setViewMode(savedView);
    }

    const savedDensity =
      localStorage.getItem(
        "sidebars-density"
      );

    if (
      savedDensity ===
        "comfortable" ||
      savedDensity ===
        "standard" ||
      savedDensity ===
        "compact"
    ) {
      setDensity(savedDensity);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebars-view",
      viewMode
    );
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(
      "sidebars-density",
      density
    );
  }, [density]);

  /* ==========================================================
     SIDEBARS
  ========================================================== */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "sidebars",
      page,
      pageSize,
      filters,
    ],

    queryFn: () =>
      fetchSidebars(
        filters,
        page,
        pageSize
      ),

    placeholderData:
      keepPreviousData,
  });

  const sidebars =
    data?.content ?? [];

  const totalElements =
    data?.totalElements ?? 0;

  const totalPages =
    data?.totalPages ?? 0;

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearch = (): void => {
    setFilters(
      (current) => ({
        ...current,
        search:
          searchInput.trim(),
      })
    );

    setPage(0);
  };

  const clearSearch = (): void => {
    setSearchInput("");

    setFilters(
      (current) => ({
        ...current,
        search: "",
      })
    );

    setPage(0);
  };

  /* ==========================================================
     FILTER
  ========================================================== */

  const openFilters = (): void => {
    setDraftFilters(filters);
    setFilterOpen(true);
  };

  const applyFilters = (): void => {
    setFilters({
      ...draftFilters,
      search: filters.search,
    });

    setPage(0);
    setFilterOpen(false);
  };

  const resetFilters = (): void => {
    setDraftFilters(
      DEFAULT_FILTERS
    );
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async (
    sidebar: Sidebar
  ): Promise<void> => {
    const confirmed =
      window.confirm(
        `Delete sidebar "${sidebar.sidebarName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.delete(
        `/api/v1/sidebars/${sidebar.id}`
      );

      await queryClient.invalidateQueries({
        queryKey: ["sidebars"],
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data
          ?.message ??
          "Failed to delete sidebar."
      );
    }
  };

  /* ==========================================================
     RESTORE
  ========================================================== */

  const handleRestore = async (
    sidebar: Sidebar
  ): Promise<void> => {
    const confirmed =
      window.confirm(
        `Restore sidebar "${sidebar.sidebarName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.put(
        `/api/v1/sidebars/${sidebar.id}/restore`
      );

      await queryClient.invalidateQueries({
        queryKey: ["sidebars"],
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data
          ?.message ??
          "Failed to restore sidebar."
      );
    }
  };

  /* ==========================================================
     SORT
  ========================================================== */

  const changeSort = (
    field: string
  ): void => {
    setFilters(
      (current) => ({
        ...current,

        sortBy: field,

        sortDirection:
          current.sortBy === field &&
          current.sortDirection ===
            "ASC"
            ? "DESC"
            : "ASC",
      })
    );

    setPage(0);
  };

  /* ==========================================================
     ACTIVE FILTERS
  ========================================================== */

  const activeFilters =
    useMemo<string[]>(
      () => {
        const result: string[] =
          [];

        if (filters.search) {
          result.push(
            `Search: ${filters.search}`
          );
        }

        if (
          filters.sidebarName
        ) {
          result.push(
            `Name: ${filters.sidebarName}`
          );
        }

        if (
          filters.status !==
          "ACTIVE"
        ) {
          result.push(
            `Status: ${filters.status}`
          );
        }

        if (filters.createdFrom) {
          result.push(
            `Created From: ${filters.createdFrom}`
          );
        }

        if (filters.createdTo) {
          result.push(
            `Created To: ${filters.createdTo}`
          );
        }

        if (filters.updatedFrom) {
          result.push(
            `Updated From: ${filters.updatedFrom}`
          );
        }

        if (filters.updatedTo) {
          result.push(
            `Updated To: ${filters.updatedTo}`
          );
        }

        return result;
      },
      [filters]
    );

  /* ==========================================================
     DENSITY
  ========================================================== */

  const rowPadding =
    density === "compact"
      ? "py-2"
      : density === "comfortable"
      ? "py-5"
      : "py-3";

  /* ==========================================================
     ERROR
  ========================================================== */

  if (isError) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-6">

        <Card>

          <CardContent className="p-6">

            <p className="font-medium text-destructive">
              Failed to load sidebars
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error)?.message ??
                "Unable to load sidebars."}
            </p>

            <Button
              className="mt-4"
              variant="outline"
              onClick={() =>
                refetch()
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>

          </CardContent>

        </Card>

      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20">

      <div className="w-full min-w-0 p-4 sm:p-6">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Sidebars
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage sidebars and their display order.
            </p>

          </div>

          <Button
            onClick={() =>
              navigate(
                "/sidebars/new"
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sidebar
          </Button>

        </div>

        {/* SEARCH */}

        <Card className="mb-4">

          <CardContent className="px-4 py-0">

            <div className="flex flex-col gap-3 md:flex-row">

              <div className="relative min-w-0 flex-1">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  placeholder="Search sidebars..."
                  className="pl-9"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

              </div>

              <Button
                onClick={
                  handleSearch
                }
              >
                Search
              </Button>

              <Button
                variant="outline"
                onClick={
                  openFilters
                }
              >
                Filters
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  refetch()
                }
              >
                <RefreshCw
                  className={
                    isFetching
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4"
                  }
                />
              </Button>

            </div>

          </CardContent>

        </Card>

        {/* ACTIVE FILTERS */}

        {activeFilters.length >
          0 && (
          <div className="mb-4 flex flex-wrap gap-2">

            {activeFilters.map(
              (
                filter: string
              ) => (
                <Badge
                  key={filter}
                  variant="secondary"
                >
                  {filter}
                </Badge>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters(
                  DEFAULT_FILTERS
                );

                setSearchInput("");

                setPage(0);
              }}
            >
              Clear
            </Button>

          </div>
        )}

        {/* TOOLBAR */}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">

          <p className="text-sm font-medium">
            {totalElements.toLocaleString(
              "en-IN"
            )}{" "}
            sidebars
          </p>

          <div className="flex flex-wrap items-center gap-2">

            {/* COLUMNS */}

            <DropdownMenu>

              <DropdownMenuTrigger
                asChild
              >
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Columns3 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">

                {Object.entries(
                  DEFAULT_COLUMNS
                ).map(
                  ([key]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={
                        visibleColumns[
                          key as keyof VisibleColumns
                        ]
                      }
                      onCheckedChange={(
                        checked: boolean
                      ) =>
                        setVisibleColumns(
                          (
                            current
                          ) => ({
                            ...current,
                            [key]:
                              checked,
                          })
                        )
                      }
                    >
                      {key
                        .charAt(
                          0
                        )
                        .toUpperCase() +
                        key.slice(
                          1
                        )}
                    </DropdownMenuCheckboxItem>
                  )
                )}

              </DropdownMenuContent>

            </DropdownMenu>

            {/* DENSITY */}

            <Select
              value={density}
              onValueChange={(
                value: Density
              ) =>
                setDensity(value)
              }
            >

              <SelectTrigger className="w-[125px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="comfortable">
                  Comfortable
                </SelectItem>

                <SelectItem value="standard">
                  Standard
                </SelectItem>

                <SelectItem value="compact">
                  Compact
                </SelectItem>

              </SelectContent>

            </Select>

            {/* VIEW */}

            <div className="flex rounded-md border bg-background p-1">

              <Button
                variant={
                  viewMode ===
                  "table"
                    ? "secondary"
                    : "ghost"
                }
                size="icon"
                onClick={() =>
                  setViewMode(
                    "table"
                  )
                }
              >
                <Table2 className="h-4 w-4" />
              </Button>

              <Button
                variant={
                  viewMode ===
                  "list"
                    ? "secondary"
                    : "ghost"
                }
                size="icon"
                onClick={() =>
                  setViewMode(
                    "list"
                  )
                }
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                variant={
                  viewMode ===
                  "card"
                    ? "secondary"
                    : "ghost"
                }
                size="icon"
                onClick={() =>
                  setViewMode(
                    "card"
                  )
                }
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>

            </div>

          </div>

        </div>

        {/* ACTION ERROR */}

        {actionError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {/* CONTENT */}

        {isLoading ? (

          <Card>

            <CardContent className="flex min-h-[300px] items-center justify-center">

              <div className="flex flex-col items-center gap-3">

                <Loader2 className="h-7 w-7 animate-spin text-primary" />

                <p className="text-sm text-muted-foreground">
                  Loading sidebars...
                </p>

              </div>

            </CardContent>

          </Card>

        ) : sidebars.length === 0 ? (

          <Card>

            <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">

              <Table2 className="mb-3 h-10 w-10 text-muted-foreground" />

              <h3 className="font-medium">
                No sidebars found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Create your first sidebar to get started.
              </p>

              <Button
                className="mt-4"
                onClick={() =>
                  navigate(
                    "/sidebars/new"
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Sidebar
              </Button>

            </CardContent>

          </Card>

        ) : (

          <>
            {/* ==================================================
                TABLE
            ================================================== */}

            {viewMode ===
              "table" && (

              <Card className="p-0">

                <div className="w-full overflow-x-auto">

                  <Table>

                    <TableHeader>

                      <TableRow>

                        {visibleColumns.sidebar && (
                          <TableHead
                            className="cursor-pointer"
                            onClick={() =>
                              changeSort(
                                "sidebarName"
                              )
                            }
                          >
                            Sidebar
                          </TableHead>
                        )}

                        {visibleColumns.displayOrder && (
                          <TableHead
                            className="cursor-pointer"
                            onClick={() =>
                              changeSort(
                                "displayOrder"
                              )
                            }
                          >
                            Display Order
                          </TableHead>
                        )}

                        {visibleColumns.description && (
                          <TableHead>
                            Description
                          </TableHead>
                        )}

                        {visibleColumns.status && (
                          <TableHead>
                            Status
                          </TableHead>
                        )}

                        {visibleColumns.created && (
                          <TableHead
                            className="cursor-pointer"
                            onClick={() =>
                              changeSort(
                                "createdAt"
                              )
                            }
                          >
                            Created
                          </TableHead>
                        )}

                        {visibleColumns.updated && (
                          <TableHead>
                            Updated
                          </TableHead>
                        )}

                        <TableHead />

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      {sidebars.map(
                        (
                          sidebar
                        ) => (

                          <TableRow
                            key={
                              sidebar.id
                            }
                            className={
                              sidebar.deleted
                                ? "opacity-60"
                                : ""
                            }
                          >

                            {visibleColumns.sidebar && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                    {getInitials(
                                      sidebar.sidebarName
                                    )}
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate font-medium">
                                      {
                                        sidebar.sidebarName
                                      }
                                    </p>

                                  </div>

                                </div>

                              </TableCell>
                            )}

                            {visibleColumns.displayOrder && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                <span className="font-medium">
                                  {
                                    sidebar.displayOrder
                                  }
                                </span>
                              </TableCell>
                            )}

                            {visibleColumns.description && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                <p className="max-w-[300px] truncate text-sm text-muted-foreground">
                                  {sidebar.sidebarDescription ||
                                    "-"}
                                </p>
                              </TableCell>
                            )}

                            {visibleColumns.status && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                <StatusBadge
                                  active={
                                    sidebar.active
                                  }
                                  deleted={
                                    sidebar.deleted
                                  }
                                />
                              </TableCell>
                            )}

                            {visibleColumns.created && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                {formatDate(
                                  sidebar.createdAt
                                )}
                              </TableCell>
                            )}

                            {visibleColumns.updated && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                {formatDate(
                                  sidebar.updatedAt
                                )}
                              </TableCell>
                            )}

                            <TableCell>

                              <SidebarActions
                                sidebar={
                                  sidebar
                                }

                                onView={() =>
                                  navigate(
                                    `/sidebars/${sidebar.id}`
                                  )
                                }

                                onEdit={() =>
                                  navigate(
                                    `/sidebars/${sidebar.id}/edit`
                                  )
                                }

                                onDelete={() =>
                                  handleDelete(
                                    sidebar
                                  )
                                }

                                onRestore={() =>
                                  handleRestore(
                                    sidebar
                                  )
                                }
                              />

                            </TableCell>

                          </TableRow>

                        )
                      )}

                    </TableBody>

                  </Table>

                </div>

              </Card>
            )}

            {/* ==================================================
                LIST
            ================================================== */}

            {viewMode ===
              "list" && (

              <div className="space-y-3">

                {sidebars.map(
                  (
                    sidebar
                  ) => (

                    <Card
                      className="p-0"
                      key={
                        sidebar.id
                      }
                    >

                      <CardContent className="p-4">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                          <div className="flex min-w-0 flex-1 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                              {getInitials(
                                sidebar.sidebarName
                              )}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-medium">
                                {
                                  sidebar.sidebarName
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Display Order:{" "}
                                {
                                  sidebar.displayOrder
                                }
                              </p>

                            </div>

                          </div>

                          <span className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {
                              sidebar.sidebarDescription ??
                              "-"
                            }
                          </span>

                          <StatusBadge
                            active={
                              sidebar.active
                            }
                            deleted={
                              sidebar.deleted
                            }
                          />

                          <SidebarActions
                            sidebar={
                              sidebar
                            }
                            onView={() =>
                              navigate(
                                `/sidebars/${sidebar.id}`
                              )
                            }
                            onEdit={() =>
                              navigate(
                                `/sidebars/${sidebar.id}/edit`
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                sidebar
                              )
                            }
                            onRestore={() =>
                              handleRestore(
                                sidebar
                              )
                            }
                          />

                        </div>

                      </CardContent>

                    </Card>

                  )
                )}

              </div>
            )}

            {/* ==================================================
                CARD
            ================================================== */}

            {viewMode ===
              "card" && (

              <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {sidebars.map(
                  (
                    sidebar
                  ) => (

                    <Card
                      className="p-0"
                      key={
                        sidebar.id
                      }
                    >

                      <CardContent className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                              {getInitials(
                                sidebar.sidebarName
                              )}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-semibold">
                                {
                                  sidebar.sidebarName
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Order:{" "}
                                {
                                  sidebar.displayOrder
                                }
                              </p>

                            </div>

                          </div>

                          <SidebarActions
                            sidebar={
                              sidebar
                            }
                            onView={() =>
                              navigate(
                                `/sidebars/${sidebar.id}`
                              )
                            }
                            onEdit={() =>
                              navigate(
                                `/sidebars/${sidebar.id}/edit`
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                sidebar
                              )
                            }
                            onRestore={() =>
                              handleRestore(
                                sidebar
                              )
                            }
                          />

                        </div>

                        <div className="mt-5 space-y-3 text-sm">

                          <div className="flex justify-between gap-3">

                            <span className="text-muted-foreground">
                              Display Order
                            </span>

                            <span>
                              {
                                sidebar.displayOrder
                              }
                            </span>

                          </div>

                          <div className="flex justify-between gap-3">

                            <span className="text-muted-foreground">
                              Description
                            </span>

                            <span className="max-w-[180px] truncate text-right">
                              {
                                sidebar.sidebarDescription ||
                                "-"
                              }
                            </span>

                          </div>

                          <div className="flex justify-between gap-3">

                            <span className="text-muted-foreground">
                              Created
                            </span>

                            <span>
                              {formatDate(
                                sidebar.createdAt
                              )}
                            </span>

                          </div>

                          <StatusBadge
                            active={
                              sidebar.active
                            }
                            deleted={
                              sidebar.deleted
                            }
                          />

                        </div>

                      </CardContent>

                    </Card>

                  )
                )}

              </div>
            )}

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-muted-foreground">

                Page{" "}

                {totalPages === 0
                  ? 0
                  : page + 1}

                {" "}of{" "}

                {totalPages}

              </p>

              <div className="flex items-center gap-2">

                <Select
                  value={String(
                    pageSize
                  )}
                  onValueChange={(
                    value: string
                  ) => {

                    setPageSize(
                      Number(value)
                    );

                    setPage(0);

                  }}
                >

                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="10">
                      10 / page
                    </SelectItem>

                    <SelectItem value="20">
                      20 / page
                    </SelectItem>

                    <SelectItem value="50">
                      50 / page
                    </SelectItem>

                    <SelectItem value="100">
                      100 / page
                    </SelectItem>

                  </SelectContent>

                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={
                    page === 0
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          0,
                          current -
                            1
                        )
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={
                    page >=
                    totalPages - 1
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current + 1
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

              </div>

            </div>

          </>

        )}

        {/* ======================================================
            FILTER SHEET
        ====================================================== */}

        <Sheet
          open={filterOpen}
          onOpenChange={
            setFilterOpen
          }
        >

          <SheetContent className="w-full overflow-y-auto sm:max-w-lg">

            <SheetHeader>

              <SheetTitle>
                Sidebar Filters
              </SheetTitle>

              <SheetDescription>
                Filter sidebars by name, status and dates.
              </SheetDescription>

            </SheetHeader>

            <div className="space-y-5 py-6">

              {/* NAME */}

              <div className="space-y-2">

                <label className="text-sm font-medium">
                  Sidebar Name
                </label>

                <Input
                  value={
                    draftFilters.sidebarName
                  }
                  onChange={(
                    event
                  ) =>
                    setDraftFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        sidebarName:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />

              </div>

              {/* STATUS */}

              <div className="space-y-2">

                <label className="text-sm font-medium">
                  Status
                </label>

                <Select
                  value={
                    draftFilters.status
                  }
                  onValueChange={(
                    value:
                      | "ACTIVE"
                      | "INACTIVE"
                      | "DELETED"
                      | "ALL"
                  ) =>
                    setDraftFilters(
                      (
                        current
                      ) => ({
                        ...current,

                        status:
                          value,

                        includeDeleted:
                          value ===
                            "DELETED" ||
                          value ===
                            "ALL",
                      })
                    )
                  }
                >

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="ACTIVE">
                      Active
                    </SelectItem>

                    <SelectItem value="INACTIVE">
                      Inactive
                    </SelectItem>

                    <SelectItem value="DELETED">
                      Deleted
                    </SelectItem>

                    <SelectItem value="ALL">
                      All
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>

              {/* CREATED */}

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Created From
                  </label>

                  <Input
                    type="date"
                    value={
                      draftFilters.createdFrom
                    }
                    onChange={(
                      event
                    ) =>
                      setDraftFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          createdFrom:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                </div>

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Created To
                  </label>

                  <Input
                    type="date"
                    value={
                      draftFilters.createdTo
                    }
                    onChange={(
                      event
                    ) =>
                      setDraftFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          createdTo:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                </div>

              </div>

              {/* UPDATED */}

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Updated From
                  </label>

                  <Input
                    type="date"
                    value={
                      draftFilters.updatedFrom
                    }
                    onChange={(
                      event
                    ) =>
                      setDraftFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          updatedFrom:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                </div>

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Updated To
                  </label>

                  <Input
                    type="date"
                    value={
                      draftFilters.updatedTo
                    }
                    onChange={(
                      event
                    ) =>
                      setDraftFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          updatedTo:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                </div>

              </div>

            </div>

            <SheetFooter>

              <Button
                variant="outline"
                onClick={
                  resetFilters
                }
              >
                Reset
              </Button>

              <Button
                onClick={
                  applyFilters
                }
              >
                Apply Filters
              </Button>

            </SheetFooter>

          </SheetContent>

        </Sheet>

      </div>

    </div>
  );
}