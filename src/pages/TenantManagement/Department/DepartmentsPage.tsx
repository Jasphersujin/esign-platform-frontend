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
  Building2,
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

/* ============================================================
   TYPES
============================================================ */

interface Organization {
  id: string;
  orgName?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Department {
  id: string;
  organizationId: string;
  organizationName?: string;
  departmentName: string;
  departmentCode: string;
  departmentType?: string | null;
  description?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

interface DepartmentPageResponse {
  content: Department[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface DepartmentFilters {
  organizationId: string;
  search: string;
  departmentName: string;
  departmentCode: string;
  departmentType: string;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | "ALL";
  includeDeleted: boolean;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

type ViewMode = "table" | "list" | "card";

type Density =
  | "comfortable"
  | "standard"
  | "compact";

interface VisibleColumns {
  department: boolean;
  organization: boolean;
  code: boolean;
  type: boolean;
  status: boolean;
  created: boolean;
  updated: boolean;
}

/* ============================================================
   CONSTANTS
============================================================ */

const DEPARTMENT_TYPES = [
  {
    value: "HR",
    label: "Human Resources",
  },
  {
    value: "FINANCE",
    label: "Finance",
  },
  {
    value: "IT",
    label: "Information Technology",
  },
  {
    value: "OPERATIONS",
    label: "Operations",
  },
  {
    value: "SALES",
    label: "Sales",
  },
  {
    value: "MARKETING",
    label: "Marketing",
  },
  {
    value: "LEGAL",
    label: "Legal",
  },
  {
    value: "PROCUREMENT",
    label: "Procurement",
  },
  {
    value: "QUALITY",
    label: "Quality",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const DEFAULT_FILTERS: DepartmentFilters = {
  organizationId: "",
  search: "",
  departmentName: "",
  departmentCode: "",
  departmentType: "",
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
  department: true,
  organization: true,
  code: true,
  type: true,
  status: true,
  created: true,
  updated: false,
};

/* ============================================================
   HELPERS
============================================================ */

function formatDepartmentType(
  value?: string | null
): string {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character: string) =>
        character.toUpperCase()
    );
}

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
    return "DP";
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

async function fetchDepartments(
  filters: DepartmentFilters,
  page: number,
  size: number
): Promise<DepartmentPageResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("size", String(size));

  if (filters.organizationId) {
    params.set(
      "organizationId",
      filters.organizationId
    );
  }

  if (filters.search.trim()) {
    params.set(
      "search",
      filters.search.trim()
    );
  }

  if (filters.departmentName.trim()) {
    params.set(
      "departmentName",
      filters.departmentName.trim()
    );
  }

  if (filters.departmentCode.trim()) {
    params.set(
      "departmentCode",
      filters.departmentCode.trim()
    );
  }

  if (filters.departmentType) {
    params.set(
      "departmentType",
      filters.departmentType
    );
  }

  if (filters.status === "ACTIVE") {
    params.set("active", "true");
  }

  if (filters.status === "INACTIVE") {
    params.set("active", "false");
  }

  if (filters.status === "DELETED") {
    params.set("deleted", "true");
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
    await api.get<DepartmentPageResponse>(
      `/api/v1/departments/search?${params.toString()}`
    );

  return response.data;
}

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response = await api.get(
    "/api/v1/organizations?size=100"
  );

  const data = response.data?.data ??
    response.data;

  return (
    data?.content ??
    data ??
    []
  );
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

interface DepartmentActionsProps {
  department: Department;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

function DepartmentActions({
  department,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: DepartmentActionsProps) {
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

        {!department.deleted && (
          <DropdownMenuItem
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {department.deleted ? (
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

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const queryClient =
    useQueryClient();

  const [searchInput, setSearchInput] =
    useState<string>("");

  const [filters, setFilters] =
    useState<DepartmentFilters>(
      DEFAULT_FILTERS
    );

  const [draftFilters, setDraftFilters] =
    useState<DepartmentFilters>(
      DEFAULT_FILTERS
    );

  const [filterOpen, setFilterOpen] =
    useState<boolean>(false);

  const [page, setPage] =
    useState<number>(0);

  const [pageSize, setPageSize] =
    useState<number>(20);

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  const [density, setDensity] =
    useState<Density>("standard");

  const [visibleColumns, setVisibleColumns] =
    useState<VisibleColumns>(
      DEFAULT_COLUMNS
    );

  const [actionError, setActionError] =
    useState<string>("");

  useEffect(() => {
    const savedView =
      localStorage.getItem(
        "departments-view"
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
        "departments-density"
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
      "departments-view",
      viewMode
    );
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(
      "departments-density",
      density
    );
  }, [density]);

  /* ==========================================================
     ORGANIZATIONS
  ========================================================== */

  const {
    data: organizations = [],
    isLoading:
      organizationsLoading,
  } = useQuery({
    queryKey: [
      "organizations",
      "department-selector",
    ],
    queryFn: fetchOrganizations,
    staleTime: 60_000,
  });

  /* ==========================================================
     DEPARTMENTS
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
      "departments",
      page,
      pageSize,
      filters,
    ],
    queryFn: () =>
      fetchDepartments(
        filters,
        page,
        pageSize
      ),
    placeholderData:
      keepPreviousData,
  });

  const departments =
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
    department: Department
  ): Promise<void> => {
    const confirmed =
      window.confirm(
        `Delete department "${department.departmentName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.delete(
        `/api/v1/departments/${department.id}`
      );

      await queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data
          ?.message ??
          "Failed to delete department."
      );
    }
  };

  /* ==========================================================
     RESTORE
  ========================================================== */

  const handleRestore = async (
    department: Department
  ): Promise<void> => {
    const confirmed =
      window.confirm(
        `Restore department "${department.departmentName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.put(
        `/api/v1/departments/${department.id}/restore`
      );

      await queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data
          ?.message ??
          "Failed to restore department."
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

        if (filters.organizationId) {
          const organization =
            organizations.find(
              (
                item: Organization
              ) =>
                item.id ===
                filters.organizationId
            );

          result.push(
            `Organization: ${
              organization?.orgName ??
              filters.organizationId
            }`
          );
        }

        if (filters.departmentName) {
          result.push(
            `Name: ${filters.departmentName}`
          );
        }

        if (filters.departmentCode) {
          result.push(
            `Code: ${filters.departmentCode}`
          );
        }

        if (filters.departmentType) {
          result.push(
            `Type: ${formatDepartmentType(
              filters.departmentType
            )}`
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

        return result;
      },
      [
        filters,
        organizations,
      ]
    );

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
              Failed to load departments
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error)?.message ??
                "Unable to load departments."}
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
              Departments
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage departments across your organizations.
            </p>
          </div>

          <Button
            onClick={() =>
              navigate(
                "/departments/new"
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
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
                  placeholder="Search departments..."
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
            departments
          </p>

          <div className="flex flex-wrap items-center gap-2">

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
                  ([
                    key,
                  ]) => (
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

            <div className="flex rounded-md border bg-background p-1">
              <Button
                variant={
                  viewMode === "table"
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
                  viewMode === "list"
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
                  viewMode === "card"
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

        {/* LOADING */}

        {isLoading ? (
          <Card>
            <CardContent className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />

                <p className="text-sm text-muted-foreground">
                  Loading departments...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : departments.length ===
          0 ? (
          <Card>
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />

              <h3 className="font-medium">
                No departments found
              </h3>

              <Button
                className="mt-4"
                onClick={() =>
                  navigate(
                    "/departments/new"
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* TABLE */}

            {viewMode ===
              "table" && (
              <Card className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>

                        {visibleColumns.department && (
                          <TableHead
                            className="cursor-pointer"
                            onClick={() =>
                              changeSort(
                                "departmentName"
                              )
                            }
                          >
                            Department
                          </TableHead>
                        )}

                        {visibleColumns.organization && (
                          <TableHead>
                            Organization
                          </TableHead>
                        )}

                        {visibleColumns.code && (
                          <TableHead>
                            Code
                          </TableHead>
                        )}

                        {visibleColumns.type && (
                          <TableHead>
                            Type
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
                      {departments.map(
                        (
                          department
                        ) => (
                          <TableRow
                            key={
                              department.id
                            }
                            className={
                              department.deleted
                                ? "opacity-60"
                                : ""
                            }
                          >

                            {visibleColumns.department && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                    {getInitials(
                                      department.departmentName
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-medium">
                                      {
                                        department.departmentName
                                      }
                                    </p>

                                    {department.description && (
                                      <p className="max-w-[250px] truncate text-xs text-muted-foreground">
                                        {
                                          department.description
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            )}

                            {visibleColumns.organization && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />

                                  {
                                    department.organizationName ??
                                    "-"
                                  }
                                </div>
                              </TableCell>
                            )}

                            {visibleColumns.code && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                <code className="rounded bg-muted px-2 py-1 text-xs">
                                  {
                                    department.departmentCode
                                  }
                                </code>
                              </TableCell>
                            )}

                            {visibleColumns.type && (
                              <TableCell
                                className={
                                  rowPadding
                                }
                              >
                                {formatDepartmentType(
                                  department.departmentType
                                )}
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
                                    department.active
                                  }
                                  deleted={
                                    department.deleted
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
                                  department.createdAt
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
                                  department.updatedAt
                                )}
                              </TableCell>
                            )}

                            <TableCell>
                              <DepartmentActions
                                department={
                                  department
                                }
                                onView={() =>
                                  navigate(
                                    `/departments/${department.id}`
                                  )
                                }
                                onEdit={() =>
                                  navigate(
                                    `/departments/${department.id}/edit`
                                  )
                                }
                                onDelete={() =>
                                  handleDelete(
                                    department
                                  )
                                }
                                onRestore={() =>
                                  handleRestore(
                                    department
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

            {/* LIST */}

            {viewMode ===
              "list" && (
              <div className="space-y-3">
                {departments.map(
                  (
                    department
                  ) => (
                    <Card
                      className="p-0"
                      key={
                        department.id
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                              {getInitials(
                                department.departmentName
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {
                                  department.departmentName
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  department.departmentCode
                                }
                              </p>
                            </div>
                          </div>

                          <span className="text-sm text-muted-foreground">
                            {
                              department.organizationName ??
                              "-"
                            }
                          </span>

                          <StatusBadge
                            active={
                              department.active
                            }
                            deleted={
                              department.deleted
                            }
                          />

                          <DepartmentActions
                            department={
                              department
                            }
                            onView={() =>
                              navigate(
                                `/departments/${department.id}`
                              )
                            }
                            onEdit={() =>
                              navigate(
                                `/departments/${department.id}/edit`
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                department
                              )
                            }
                            onRestore={() =>
                              handleRestore(
                                department
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

            {/* CARD */}

            {viewMode ===
              "card" && (
              <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {departments.map(
                  (
                    department
                  ) => (
                    <Card
                      className="p-0"
                      key={
                        department.id
                      }
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                              {getInitials(
                                department.departmentName
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {
                                  department.departmentName
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  department.departmentCode
                                }
                              </p>
                            </div>
                          </div>

                          <DepartmentActions
                            department={
                              department
                            }
                            onView={() =>
                              navigate(
                                `/departments/${department.id}`
                              )
                            }
                            onEdit={() =>
                              navigate(
                                `/departments/${department.id}/edit`
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                department
                              )
                            }
                            onRestore={() =>
                              handleRestore(
                                department
                              )
                            }
                          />
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Organization
                            </span>

                            <span className="truncate">
                              {
                                department.organizationName ??
                                "-"
                              }
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Type
                            </span>

                            <span>
                              {formatDepartmentType(
                                department.departmentType
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Created
                            </span>

                            <span>
                              {formatDate(
                                department.createdAt
                              )}
                            </span>
                          </div>

                          <StatusBadge
                            active={
                              department.active
                            }
                            deleted={
                              department.deleted
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}

            {/* PAGINATION */}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page{" "}
                {totalPages === 0
                  ? 0
                  : page + 1}{" "}
                of{" "}
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

        {/* FILTER SHEET */}

        <Sheet
          open={filterOpen}
          onOpenChange={
            setFilterOpen
          }
        >
          <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                Department Filters
              </SheetTitle>

              <SheetDescription>
                Filter departments by organization, type, status and dates.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 py-6">

              {/* ORGANIZATION */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Organization
                </label>

                <Select
                  value={
                    draftFilters.organizationId ||
                    "ALL"
                  }
                  onValueChange={(
                    value: string
                  ) =>
                    setDraftFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        organizationId:
                          value ===
                          "ALL"
                            ? ""
                            : value,
                      })
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All organizations" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">
                      All organizations
                    </SelectItem>

                    {organizations.map(
                      (
                        organization
                      ) => (
                        <SelectItem
                          key={
                            organization.id
                          }
                          value={
                            organization.id
                          }
                        >
                          {
                            organization.orgName
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* NAME */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Department Name
                </label>

                <Input
                  value={
                    draftFilters.departmentName
                  }
                  onChange={(
                    event
                  ) =>
                    setDraftFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        departmentName:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>

              {/* CODE */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Department Code
                </label>

                <Input
                  value={
                    draftFilters.departmentCode
                  }
                  onChange={(
                    event
                  ) =>
                    setDraftFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        departmentCode:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>

              {/* TYPE */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Department Type
                </label>

                <Select
                  value={
                    draftFilters.departmentType ||
                    "ALL"
                  }
                  onValueChange={(
                    value: string
                  ) =>
                    setDraftFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        departmentType:
                          value ===
                          "ALL"
                            ? ""
                            : value,
                      })
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">
                      All Types
                    </SelectItem>

                    {DEPARTMENT_TYPES.map(
                      (type) => (
                        <SelectItem
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
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