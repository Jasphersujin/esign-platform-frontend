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
  Globe2,
  Server,
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

interface Tenant {
  id: string;
  tenantName?: string;
  name?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Organization {
  id: string;
  orgName?: string;
  name?: string;
  tenantId?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Role {
  id: string;

  roleName: string;
  roleCode: string;

  description?: string | null;

  scopeType: "GLOBAL" | "TENANT";

  tenantId?: string | null;
  tenantName?: string | null;

  organizationId?: string | null;
  organizationName?: string | null;

  active: boolean;
  deleted: boolean;

  createdAt?: string;
  updatedAt?: string;

  version?: number;
}

interface RolePageResponse {
  content: Role[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface RoleFilters {
  search: string;

  roleName: string;
  roleCode: string;

  scopeType: string;

  tenantId: string;
  organizationId: string;

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
  role: boolean;
  code: boolean;
  scope: boolean;
  tenant: boolean;
  organization: boolean;
  status: boolean;
  created: boolean;
  updated: boolean;
}

/* ============================================================
   DEFAULTS
============================================================ */

const DEFAULT_FILTERS: RoleFilters = {
  search: "",

  roleName: "",
  roleCode: "",

  scopeType: "",

  tenantId: "",
  organizationId: "",

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
  role: true,
  code: true,
  scope: true,
  tenant: true,
  organization: true,
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
    return "RL";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
        word.charAt(0).toUpperCase()
    )
    .join("");
}

/* ============================================================
   API
============================================================ */

async function fetchTenants(): Promise<Tenant[]> {
  const response = await api.get(
    "/api/v1/tenants?size=100"
  );

  const data =
    response.data?.data ??
    response.data;

  return data?.content ?? data ?? [];
}

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response = await api.get(
    "/api/v1/organizations?size=100"
  );

  const data =
    response.data?.data ??
    response.data;

  return data?.content ?? data ?? [];
}

async function fetchRoles(
  filters: RoleFilters,
  page: number,
  size: number
): Promise<RolePageResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("size", String(size));

  if (filters.search.trim()) {
    params.set(
      "search",
      filters.search.trim()
    );
  }

  if (filters.roleName.trim()) {
    params.set(
      "roleName",
      filters.roleName.trim()
    );
  }

  if (filters.roleCode.trim()) {
    params.set(
      "roleCode",
      filters.roleCode.trim()
    );
  }

  if (filters.scopeType) {
    params.set(
      "scopeType",
      filters.scopeType
    );
  }

  if (filters.tenantId) {
    params.set(
      "tenantId",
      filters.tenantId
    );
  }

  if (filters.organizationId) {
    params.set(
      "organizationId",
      filters.organizationId
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
    await api.get<RolePageResponse>(
      `/api/v1/roles/search?${params.toString()}`
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
   SCOPE BADGE
============================================================ */

function ScopeBadge({
  scopeType,
}: {
  scopeType: "GLOBAL" | "TENANT";
}) {
  if (scopeType === "GLOBAL") {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/5 text-blue-600"
      >
        <Globe2 className="mr-1 h-3.5 w-3.5" />
        Global
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-purple-500/30 bg-purple-500/5 text-purple-600"
    >
      <Server className="mr-1 h-3.5 w-3.5" />
      Tenant
    </Badge>
  );
}

/* ============================================================
   ACTIONS
============================================================ */

interface RoleActionsProps {
  role: Role;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

function RoleActions({
  role,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: RoleActionsProps) {
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
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>

        {!role.deleted && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {role.deleted ? (
          <DropdownMenuItem onClick={onRestore}>
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

export default function RolesPage() {
  const navigate = useNavigate();

  const queryClient =
    useQueryClient();

  const [searchInput, setSearchInput] =
    useState("");

  const [filters, setFilters] =
    useState<RoleFilters>(
      DEFAULT_FILTERS
    );

  const [draftFilters, setDraftFilters] =
    useState<RoleFilters>(
      DEFAULT_FILTERS
    );

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [page, setPage] =
    useState(0);

  const [pageSize, setPageSize] =
    useState(20);

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  const [density, setDensity] =
    useState<Density>("standard");

  const [visibleColumns, setVisibleColumns] =
    useState<VisibleColumns>(
      DEFAULT_COLUMNS
    );

  const [actionError, setActionError] =
    useState("");

  /* ==========================================================
     LOCAL STORAGE
  ========================================================== */

  useEffect(() => {
    const savedView =
      localStorage.getItem(
        "roles-view"
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
        "roles-density"
      );

    if (
      savedDensity === "comfortable" ||
      savedDensity === "standard" ||
      savedDensity === "compact"
    ) {
      setDensity(savedDensity);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "roles-view",
      viewMode
    );
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(
      "roles-density",
      density
    );
  }, [density]);

  /* ==========================================================
     TENANTS
  ========================================================== */

  const {
    data: tenants = [],
    isLoading: tenantsLoading,
  } = useQuery({
    queryKey: [
      "tenants",
      "role-selector",
    ],
    queryFn: fetchTenants,
    staleTime: 60_000,
  });

  /* ==========================================================
     ORGANIZATIONS
  ========================================================== */

  const {
    data: organizations = [],
    isLoading: organizationsLoading,
  } = useQuery({
    queryKey: [
      "organizations",
      "role-selector",
    ],
    queryFn: fetchOrganizations,
    staleTime: 60_000,
  });

  /* ==========================================================
     ROLES
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
      "roles",
      page,
      pageSize,
      filters,
    ],

    queryFn: () =>
      fetchRoles(
        filters,
        page,
        pageSize
      ),

    placeholderData:
      keepPreviousData,
  });

  const roles =
    data?.content ?? [];

  const totalElements =
    data?.totalElements ?? 0;

  const totalPages =
    data?.totalPages ?? 0;

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearch = () => {
    setFilters((current) => ({
      ...current,
      search:
        searchInput.trim(),
    }));

    setPage(0);
  };

  const clearSearch = () => {
    setSearchInput("");

    setFilters((current) => ({
      ...current,
      search: "",
    }));

    setPage(0);
  };

  /* ==========================================================
     FILTER
  ========================================================== */

  const openFilters = () => {
    setDraftFilters(filters);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters({
      ...draftFilters,
      search: filters.search,
    });

    setPage(0);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(
      DEFAULT_FILTERS
    );
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async (
    role: Role
  ) => {
    const confirmed =
      window.confirm(
        `Delete role "${role.roleName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.delete(
        `/api/v1/roles/${role.id}`
      );

      await queryClient.invalidateQueries({
        queryKey: ["roles"],
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data
          ?.message ??
          "Failed to delete role."
      );
    }
  };

  /* ==========================================================
     RESTORE
  ========================================================== */

  const handleRestore = async (
    role: Role
  ) => {
    const confirmed =
      window.confirm(
        `Restore role "${role.roleName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.put(
        `/api/v1/roles/${role.id}/restore`
      );

      await queryClient.invalidateQueries({
        queryKey: ["roles"],
      });
    } catch (error: any) {
      setActionError(
        error?.response?.data
          ?.message ??
          "Failed to restore role."
      );
    }
  };

  /* ==========================================================
     ACTIVE FILTERS
  ========================================================== */

  const activeFilters = useMemo(() => {
    const result: string[] = [];

    if (filters.scopeType) {
      result.push(
        filters.scopeType === "GLOBAL"
          ? "Global"
          : "Tenant"
      );
    }

    if (filters.tenantId) {
      const tenant = tenants.find(
        (item) =>
          item.id === filters.tenantId
      );

      if (tenant) {
        result.push(
          tenant.tenantName ??
            tenant.name ??
            "Tenant"
        );
      }
    }

    if (filters.organizationId) {
      const organization =
        organizations.find(
          (item) =>
            item.id ===
            filters.organizationId
        );

      if (organization) {
        result.push(
          organization.orgName ??
            organization.name ??
            "Organization"
        );
      }
    }

    if (
      filters.status !==
      "ACTIVE"
    ) {
      result.push(
        filters.status
      );
    }

    if (filters.roleName) {
      result.push(
        `Name: ${filters.roleName}`
      );
    }

    if (filters.roleCode) {
      result.push(
        `Code: ${filters.roleCode}`
      );
    }

    return result;
  }, [
    filters,
    tenants,
    organizations,
  ]);

  const filterOrganizations =
    draftFilters.tenantId
      ? organizations.filter(
          (organization) =>
            !organization.tenantId ||
            organization.tenantId ===
              draftFilters.tenantId
        )
      : [];

  /* ==========================================================
     DENSITY
  ========================================================== */

  const rowClass =
    density === "compact"
      ? "h-10"
      : density === "comfortable"
      ? "h-16"
      : "h-12";

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading roles...
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

      <div className="w-full p-4 sm:p-6">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Roles
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage global and tenant-specific access roles.
            </p>
          </div>

          <Button
            onClick={() =>
              navigate("/roles/add")
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>

        </div>

        {/* ERROR */}

        {actionError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {(error as any)?.message ??
              "Failed to load roles."}
          </div>
        )}

        {/* SEARCH */}

        <Card className="mb-4">
          <CardContent className="p-4">

            <div className="flex flex-wrap items-center gap-2">

              <div className="relative min-w-[260px] flex-1">
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
                      event.key === "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  placeholder="Search roles..."
                  className="pl-9"
                />

                {searchInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Button
                onClick={handleSearch}
              >
                Search
              </Button>

              <Button
                variant="outline"
                onClick={openFilters}
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

        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">

            {activeFilters.map(
              (filter) => (
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
            roles
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

                {(
                  Object.keys(
                    DEFAULT_COLUMNS
                  ) as Array<
                    keyof VisibleColumns
                  >
                ).map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={
                      visibleColumns[key]
                    }
                    onCheckedChange={(
                      checked
                    ) =>
                      setVisibleColumns(
                        (current) => ({
                          ...current,
                          [key]: Boolean(
                            checked
                          ),
                        })
                      )
                    }
                  >
                    {key
                      .charAt(0)
                      .toUpperCase() +
                      key
                        .slice(1)
                        .replace(
                          /([A-Z])/g,
                          " $1"
                        )}
                  </DropdownMenuCheckboxItem>
                ))}

              </DropdownMenuContent>
            </DropdownMenu>

            {/* VIEW */}

            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
              >
                <Button
                  variant="outline"
                  size="sm"
                >
                  {viewMode === "table" && (
                    <Table2 className="mr-2 h-4 w-4" />
                  )}

                  {viewMode === "list" && (
                    <List className="mr-2 h-4 w-4" />
                  )}

                  {viewMode === "card" && (
                    <Grid2X2 className="mr-2 h-4 w-4" />
                  )}

                  View
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">

                <DropdownMenuItem
                  onClick={() =>
                    setViewMode("table")
                  }
                >
                  <Table2 className="mr-2 h-4 w-4" />
                  Table
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    setViewMode("list")
                  }
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    setViewMode("card")
                  }
                >
                  <Grid2X2 className="mr-2 h-4 w-4" />
                  Cards
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>

            {/* DENSITY */}

            <Select
              value={density}
              onValueChange={(
                value
              ) =>
                setDensity(
                  value as Density
                )
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

          </div>
        </div>

        {/* TABLE */}

        {viewMode === "table" && (
          <Card>

            <CardContent className="p-0">

              <div className="overflow-x-auto">

                <Table>

                  <TableHeader>
                    <TableRow>

                      {visibleColumns.role && (
                        <TableHead>
                          Role
                        </TableHead>
                      )}

                      {visibleColumns.code && (
                        <TableHead>
                          Code
                        </TableHead>
                      )}

                      {visibleColumns.scope && (
                        <TableHead>
                          Scope
                        </TableHead>
                      )}

                      {visibleColumns.tenant && (
                        <TableHead>
                          Tenant
                        </TableHead>
                      )}

                      {visibleColumns.organization && (
                        <TableHead>
                          Organization
                        </TableHead>
                      )}

                      {visibleColumns.status && (
                        <TableHead>
                          Status
                        </TableHead>
                      )}

                      {visibleColumns.created && (
                        <TableHead>
                          Created
                        </TableHead>
                      )}

                      {visibleColumns.updated && (
                        <TableHead>
                          Updated
                        </TableHead>
                      )}

                      <TableHead className="w-[60px]" />

                    </TableRow>
                  </TableHeader>

                  <TableBody>

                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-32 text-center text-sm text-muted-foreground"
                        >
                          No roles found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map(
                        (role) => (
                          <TableRow
                            key={role.id}
                            className={rowClass}
                          >

                            {visibleColumns.role && (
                              <TableCell>

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                                    {getInitials(
                                      role.roleName
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-medium">
                                      {role.roleName}
                                    </p>

                                    {role.description && (
                                      <p className="max-w-[280px] truncate text-xs text-muted-foreground">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>

                                </div>

                              </TableCell>
                            )}

                            {visibleColumns.code && (
                              <TableCell>
                                <span className="font-mono text-xs">
                                  {role.roleCode}
                                </span>
                              </TableCell>
                            )}

                            {visibleColumns.scope && (
                              <TableCell>
                                <ScopeBadge
                                  scopeType={
                                    role.scopeType
                                  }
                                />
                              </TableCell>
                            )}

                            {visibleColumns.tenant && (
                              <TableCell>
                                {role.scopeType ===
                                "GLOBAL"
                                  ? "-"
                                  : role.tenantName ??
                                    role.tenantId ??
                                    "-"}
                              </TableCell>
                            )}

                            {visibleColumns.organization && (
                              <TableCell>
                                {role.scopeType ===
                                "GLOBAL"
                                  ? "-"
                                  : role.organizationName ??
                                    role.organizationId ??
                                    "-"}
                              </TableCell>
                            )}

                            {visibleColumns.status && (
                              <TableCell>
                                <StatusBadge
                                  active={
                                    role.active
                                  }
                                  deleted={
                                    role.deleted
                                  }
                                />
                              </TableCell>
                            )}

                            {visibleColumns.created && (
                              <TableCell>
                                {formatDate(
                                  role.createdAt
                                )}
                              </TableCell>
                            )}

                            {visibleColumns.updated && (
                              <TableCell>
                                {formatDate(
                                  role.updatedAt
                                )}
                              </TableCell>
                            )}

                            <TableCell>
                              <RoleActions
                                role={role}
                                onView={() =>
                                  navigate(
                                    `/roles/${role.id}`
                                  )
                                }
                                onEdit={() =>
                                  navigate(
                                    `/roles/${role.id}/edit`
                                  )
                                }
                                onDelete={() =>
                                  handleDelete(
                                    role
                                  )
                                }
                                onRestore={() =>
                                  handleRestore(
                                    role
                                  )
                                }
                              />
                            </TableCell>

                          </TableRow>
                        )
                      )
                    )}

                  </TableBody>

                </Table>

              </div>

            </CardContent>

          </Card>
        )}

        {/* LIST VIEW */}

        {viewMode === "list" && (
          <div className="space-y-2">

            {roles.map((role) => (
              <Card
                key={role.id}
                className="cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() =>
                  navigate(
                    `/roles/${role.id}`
                  )
                }
              >
                <CardContent className="p-4">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                      {getInitials(
                        role.roleName
                      )}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="font-medium">
                        {role.roleName}
                      </p>

                      <p className="font-mono text-xs text-muted-foreground">
                        {role.roleCode}
                      </p>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      <ScopeBadge
                        scopeType={
                          role.scopeType
                        }
                      />

                      <StatusBadge
                        active={
                          role.active
                        }
                        deleted={
                          role.deleted
                        }
                      />

                    </div>

                    <RoleActions
                      role={role}
                      onView={() =>
                        navigate(
                          `/roles/${role.id}`
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/roles/${role.id}/edit`
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          role
                        )
                      }
                      onRestore={() =>
                        handleRestore(
                          role
                        )
                      }
                    />

                  </div>

                </CardContent>
              </Card>
            ))}

          </div>
        )}

        {/* CARD VIEW */}

        {viewMode === "card" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {roles.map((role) => (
              <Card
                key={role.id}
                className="cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() =>
                  navigate(
                    `/roles/${role.id}`
                  )
                }
              >

                <CardContent className="p-5">

                  <div className="mb-4 flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                      {getInitials(
                        role.roleName
                      )}
                    </div>

                    <RoleActions
                      role={role}
                      onView={() =>
                        navigate(
                          `/roles/${role.id}`
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/roles/${role.id}/edit`
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          role
                        )
                      }
                      onRestore={() =>
                        handleRestore(
                          role
                        )
                      }
                    />

                  </div>

                  <h3 className="font-semibold">
                    {role.roleName}
                  </h3>

                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {role.roleCode}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <ScopeBadge
                      scopeType={
                        role.scopeType
                      }
                    />

                    <StatusBadge
                      active={
                        role.active
                      }
                      deleted={
                        role.deleted
                      }
                    />

                  </div>

                  <div className="mt-5 space-y-3 border-t pt-4">

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tenant
                      </p>

                      <p className="text-sm">
                        {role.scopeType ===
                        "GLOBAL"
                          ? "Global"
                          : role.tenantName ??
                            "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Organization
                      </p>

                      <p className="text-sm">
                        {role.scopeType ===
                        "GLOBAL"
                          ? "Global"
                          : role.organizationName ??
                            "-"}
                      </p>
                    </div>

                  </div>

                </CardContent>
              </Card>
            ))}

          </div>
        )}

        {/* PAGINATION */}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-muted-foreground">
            Page {totalPages === 0
              ? 0
              : page + 1}{" "}
            of {totalPages}
          </p>

          <div className="flex items-center gap-2">

            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
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
              disabled={page === 0}
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      current - 1,
                      0
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
                  (current) =>
                    Math.min(
                      current + 1,
                      Math.max(
                        totalPages - 1,
                        0
                      )
                    )
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

          </div>
        </div>

      </div>

      {/* FILTER SHEET */}

      <Sheet
        open={filterOpen}
        onOpenChange={
          setFilterOpen
        }
      >

        <SheetContent
          className="w-full sm:max-w-md overflow-y-auto"
        >

          <SheetHeader>
            <SheetTitle>
              Role Filters
            </SheetTitle>

            <SheetDescription>
              Filter roles by scope, tenant, organization and status.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6">

            {/* ROLE NAME */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role Name
              </label>

              <Input
                value={
                  draftFilters.roleName
                }
                onChange={(event) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      roleName:
                        event.target.value,
                    })
                  )
                }
                placeholder="Search role name"
              />
            </div>

            {/* ROLE CODE */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role Code
              </label>

              <Input
                value={
                  draftFilters.roleCode
                }
                onChange={(event) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      roleCode:
                        event.target.value,
                    })
                  )
                }
                placeholder="MANUFACTURER_ADMIN"
              />
            </div>

            {/* SCOPE */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Scope
              </label>

              <Select
                value={
                  draftFilters.scopeType ||
                  "ALL"
                }
                onValueChange={(value) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      scopeType:
                        value === "ALL"
                          ? ""
                          : value,
                      tenantId: "",
                      organizationId:
                        "",
                    })
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All scopes
                  </SelectItem>

                  <SelectItem value="GLOBAL">
                    Global
                  </SelectItem>

                  <SelectItem value="TENANT">
                    Tenant Specific
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TENANT */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tenant
              </label>

              <Select
                value={
                  draftFilters.tenantId ||
                  "ALL"
                }
                onValueChange={(value) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      tenantId:
                        value === "ALL"
                          ? ""
                          : value,
                      organizationId:
                        "",
                    })
                  )
                }
                disabled={
                  draftFilters.scopeType ===
                  "GLOBAL"
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All tenants
                  </SelectItem>

                  {tenants.map(
                    (tenant) => (
                      <SelectItem
                        key={tenant.id}
                        value={tenant.id}
                      >
                        {tenant.tenantName ??
                          tenant.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

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
                onValueChange={(value) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      organizationId:
                        value === "ALL"
                          ? ""
                          : value,
                    })
                  )
                }
                disabled={
                  !draftFilters.tenantId
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All organizations
                  </SelectItem>

                  {filterOrganizations.map(
                    (organization) => (
                      <SelectItem
                        key={organization.id}
                        value={
                          organization.id
                        }
                      >
                        {organization.orgName ??
                          organization.name}
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
                onValueChange={(value) =>
                  setDraftFilters(
                    (current) => ({
                      ...current,
                      status:
                        value as RoleFilters["status"],
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

          </div>

          <SheetFooter className="gap-2 sm:flex-col">

            <Button
              className="w-full"
              onClick={
                applyFilters
              }
            >
              Apply Filters
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={
                resetFilters
              }
            >
              Reset
            </Button>

          </SheetFooter>

        </SheetContent>

      </Sheet>

    </div>
  );
}