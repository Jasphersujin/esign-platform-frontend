import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  Filter,
  Globe2,
  Grid2X2,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Table2,
  Trash2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/api/api";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

type RoleType = "GLOBAL" | "TENANT";

interface Role {
  id: string;

  organizationId?: string | null;

  roleName: string;

  roleCode: string;

  description?: string | null;

  roleType: RoleType;

  systemRole: boolean;

  active: boolean;

  deleted: boolean;

  createdAt?: string;

  updatedAt?: string;

  version?: number;
}

interface Organization {
  id: string;

  orgName?: string;

  name?: string;

  tenantId?: string | null;

  active?: boolean;

  deleted?: boolean;
}

interface Tenant {
  id: string;

  tenantName?: string;

  name?: string;

  active?: boolean;

  deleted?: boolean;
}

interface RoleFilters {
  search: string;

  roleName: string;

  roleCode: string;

  roleType: "" | RoleType;

  tenantId: string;

  organizationId: string;

  systemRole: "ALL" | "SYSTEM" | "CUSTOM";

  status: "ALL" | "ACTIVE" | "INACTIVE";

  createdFrom: string;

  createdTo: string;

  updatedFrom: string;

  updatedTo: string;
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
  type: boolean;
  organization: boolean;
  tenant: boolean;
  systemRole: boolean;
  status: boolean;
  created: boolean;
  updated: boolean;
}

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_FILTERS: RoleFilters = {
  search: "",

  roleName: "",

  roleCode: "",

  roleType: "",

  tenantId: "",

  organizationId: "",

  systemRole: "ALL",

  status: "ACTIVE",

  createdFrom: "",

  createdTo: "",

  updatedFrom: "",

  updatedTo: "",
};

const DEFAULT_COLUMNS: VisibleColumns = {
  role: true,

  code: true,

  type: true,

  organization: true,

  tenant: false,

  systemRole: true,

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

function formatDateTime(
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
      hour: "2-digit",
      minute: "2-digit",
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
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

function getRoleTypeLabel(
  roleType: RoleType
): string {
  return roleType === "GLOBAL"
    ? "Global"
    : "Tenant";
}

function getOrganizationName(
  organizationId: string | null | undefined,
  organizations: Organization[]
): string {
  if (!organizationId) {
    return "Platform";
  }

  const organization =
    organizations.find(
      (item) =>
        item.id === organizationId
    );

  return (
    organization?.orgName ??
    organization?.name ??
    organizationId
  );
}

function getTenantName(
  organizationId: string | null | undefined,
  organizations: Organization[],
  tenants: Tenant[]
): string {
  if (!organizationId) {
    return "-";
  }

  const organization =
    organizations.find(
      (item) =>
        item.id === organizationId
    );

  if (!organization?.tenantId) {
    return "-";
  }

  const tenant =
    tenants.find(
      (item) =>
        item.id === organization.tenantId
    );

  return (
    tenant?.tenantName ??
    tenant?.name ??
    organization.tenantId
  );
}

/* ============================================================
   BADGES
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

function RoleTypeBadge({
  roleType,
}: {
  roleType: RoleType;
}) {
  if (roleType === "GLOBAL") {
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

function SystemRoleBadge({
  systemRole,
}: {
  systemRole: boolean;
}) {
  if (systemRole) {
    return (
      <Badge
        variant="outline"
        className="border-primary/30 bg-primary/5 text-primary"
      >
        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
        System
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-muted-foreground"
    >
      Custom
    </Badge>
  );
}

/* ============================================================
   API
============================================================ */

async function fetchRoles(): Promise<Role[]> {
  const response =
    await api.get("/api/v1/roles");

  const data =
    response.data?.data ??
    response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response =
    await api.get(
      "/api/v1/organizations?size=1000"
    );

  const data =
    response.data?.data ??
    response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

async function fetchTenants(): Promise<
  Tenant[]
> {
  /*
   * This endpoint is optional.
   *
   * If your application does not have
   * /api/v1/tenants, the page will gracefully
   * fall back to organizations' tenantId values.
   */

  try {
    const response =
      await api.get(
        "/api/v1/tenants?size=1000"
      );

    const data =
      response.data?.data ??
      response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.content)) {
      return data.content;
    }

    return [];
  } catch {
    return [];
  }
}

/* ============================================================
   ACTION MENU
============================================================ */

interface RoleActionsProps {
  role: Role;

  onView: () => void;

  onEdit: () => void;

  onDelete: () => void;
}

function RoleActions({
  role,
  onView,
  onEdit,
  onDelete,
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
        <DropdownMenuItem
          onClick={onView}
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>

        {!role.deleted &&
          !role.systemRole && (
            <DropdownMenuItem
              onClick={onEdit}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

        {role.systemRole && (
          <DropdownMenuItem
            onClick={onView}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            View System Role
          </DropdownMenuItem>
        )}

        {!role.systemRole &&
          !role.deleted && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function RolesPage() {
  const navigate =
    useNavigate();

  const queryClient =
    useQueryClient();

  /* ==========================================================
     SEARCH
  ========================================================== */

  const [searchInput, setSearchInput] =
    useState<string>("");

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [filters, setFilters] =
    useState<RoleFilters>(
      DEFAULT_FILTERS
    );

  const [draftFilters, setDraftFilters] =
    useState<RoleFilters>(
      DEFAULT_FILTERS
    );

  const [filterOpen, setFilterOpen] =
    useState<boolean>(false);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const [page, setPage] =
    useState<number>(0);

  const [pageSize, setPageSize] =
    useState<number>(20);

  /* ==========================================================
     VIEW
  ========================================================== */

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  const [density, setDensity] =
    useState<Density>("standard");

  /* ==========================================================
     COLUMNS
  ========================================================== */

  const [visibleColumns, setVisibleColumns] =
    useState<VisibleColumns>(
      DEFAULT_COLUMNS
    );

  /* ==========================================================
     ERROR
  ========================================================== */

  const [actionError, setActionError] =
    useState<string>("");

  /* ==========================================================
     SELECTED ROLE
  ========================================================== */

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [viewOpen, setViewOpen] =
    useState<boolean>(false);

  /* ==========================================================
     LOCAL STORAGE
  ========================================================== */

  useEffect(() => {
    try {
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
        savedDensity ===
          "comfortable" ||
        savedDensity ===
          "standard" ||
        savedDensity ===
          "compact"
      ) {
        setDensity(savedDensity);
      }

      const savedColumns =
        localStorage.getItem(
          "roles-columns"
        );

      if (savedColumns) {
        const parsed =
          JSON.parse(savedColumns);

        setVisibleColumns(
          {
            ...DEFAULT_COLUMNS,
            ...parsed,
          }
        );
      }
    } catch {
      // Ignore invalid local storage values.
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

  useEffect(() => {
    localStorage.setItem(
      "roles-columns",
      JSON.stringify(
        visibleColumns
      )
    );
  }, [visibleColumns]);

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
      "role-selector",
    ],

    queryFn:
      fetchOrganizations,

    staleTime: 60_000,
  });

  /* ==========================================================
     TENANTS
  ========================================================== */

  const {
    data: tenants = [],
  } = useQuery({
    queryKey: [
      "tenants",
      "role-selector",
    ],

    queryFn:
      fetchTenants,

    staleTime: 60_000,
  });

  /* ==========================================================
     ROLES
  ========================================================== */

  const {
    data: allRoles = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["roles"],

    queryFn:
      fetchRoles,

    staleTime: 30_000,
  });

  /* ==========================================================
     FILTERED DATA
  ========================================================== */

  const filteredRoles =
    useMemo(() => {
      let result = [
        ...allRoles,
      ];

      /* ------------------------------------------------------
         SEARCH
      ------------------------------------------------------ */

      const search =
        filters.search
          .trim()
          .toLowerCase();

      if (search) {
        result =
          result.filter(
            (role) => {
              const organizationName =
                getOrganizationName(
                  role.organizationId,
                  organizations
                );

              const tenantName =
                getTenantName(
                  role.organizationId,
                  organizations,
                  tenants
                );

              return (
                role.roleName
                  ?.toLowerCase()
                  .includes(search) ||

                role.roleCode
                  ?.toLowerCase()
                  .includes(search) ||

                role.description
                  ?.toLowerCase()
                  .includes(search) ||

                organizationName
                  .toLowerCase()
                  .includes(search) ||

                tenantName
                  .toLowerCase()
                  .includes(search)
              );
            }
          );
      }

      /* ------------------------------------------------------
         ROLE NAME
      ------------------------------------------------------ */

      if (
        filters.roleName.trim()
      ) {
        const value =
          filters.roleName
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (role) =>
              role.roleName
                ?.toLowerCase()
                .includes(value)
          );
      }

      /* ------------------------------------------------------
         ROLE CODE
      ------------------------------------------------------ */

      if (
        filters.roleCode.trim()
      ) {
        const value =
          filters.roleCode
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (role) =>
              role.roleCode
                ?.toLowerCase()
                .includes(value)
          );
      }

      /* ------------------------------------------------------
         ROLE TYPE
      ------------------------------------------------------ */

      if (filters.roleType) {
        result =
          result.filter(
            (role) =>
              role.roleType ===
              filters.roleType
          );
      }

      /* ------------------------------------------------------
         ORGANIZATION
      ------------------------------------------------------ */

      if (
        filters.organizationId
      ) {
        result =
          result.filter(
            (role) =>
              role.organizationId ===
              filters.organizationId
          );
      }

      /* ------------------------------------------------------
         TENANT
      ------------------------------------------------------ */

      if (filters.tenantId) {
        result =
          result.filter(
            (role) => {
              const organization =
                organizations.find(
                  (item) =>
                    item.id ===
                    role.organizationId
                );

              return (
                organization?.tenantId ===
                filters.tenantId
              );
            }
          );
      }

      /* ------------------------------------------------------
         SYSTEM / CUSTOM
      ------------------------------------------------------ */

      if (
        filters.systemRole ===
        "SYSTEM"
      ) {
        result =
          result.filter(
            (role) =>
              role.systemRole ===
              true
          );
      }

      if (
        filters.systemRole ===
        "CUSTOM"
      ) {
        result =
          result.filter(
            (role) =>
              role.systemRole ===
              false
          );
      }

      /* ------------------------------------------------------
         STATUS
      ------------------------------------------------------ */

      if (
        filters.status ===
        "ACTIVE"
      ) {
        result =
          result.filter(
            (role) =>
              role.active ===
                true &&
              role.deleted ===
                false
          );
      }

      if (
        filters.status ===
        "INACTIVE"
      ) {
        result =
          result.filter(
            (role) =>
              role.active ===
                false &&
              role.deleted ===
                false
          );
      }

      /*
       * Deleted roles are currently not returned
       * by your GET /api/v1/roles endpoint because
       * your repository uses findByDeletedFalse().
       *
       * Therefore there is intentionally no DELETED
       * filter here.
       */

      /* ------------------------------------------------------
         CREATED FROM
      ------------------------------------------------------ */

      if (
        filters.createdFrom
      ) {
        const from =
          new Date(
            filters.createdFrom
          ).getTime();

        result =
          result.filter(
            (role) => {
              if (
                !role.createdAt
              ) {
                return false;
              }

              return (
                new Date(
                  role.createdAt
                ).getTime() >=
                from
              );
            }
          );
      }

      /* ------------------------------------------------------
         CREATED TO
      ------------------------------------------------------ */

      if (
        filters.createdTo
      ) {
        const to =
          new Date(
            `${filters.createdTo}T23:59:59`
          ).getTime();

        result =
          result.filter(
            (role) => {
              if (
                !role.createdAt
              ) {
                return false;
              }

              return (
                new Date(
                  role.createdAt
                ).getTime() <=
                to
              );
            }
          );
      }

      /* ------------------------------------------------------
         UPDATED FROM
      ------------------------------------------------------ */

      if (
        filters.updatedFrom
      ) {
        const from =
          new Date(
            filters.updatedFrom
          ).getTime();

        result =
          result.filter(
            (role) => {
              if (
                !role.updatedAt
              ) {
                return false;
              }

              return (
                new Date(
                  role.updatedAt
                ).getTime() >=
                from
              );
            }
          );
      }

      /* ------------------------------------------------------
         UPDATED TO
      ------------------------------------------------------ */

      if (
        filters.updatedTo
      ) {
        const to =
          new Date(
            `${filters.updatedTo}T23:59:59`
          ).getTime();

        result =
          result.filter(
            (role) => {
              if (
                !role.updatedAt
              ) {
                return false;
              }

              return (
                new Date(
                  role.updatedAt
                ).getTime() <=
                to
              );
            }
          );
      }

      return result;
    }, [
      allRoles,
      filters,
      organizations,
      tenants,
    ]);

  /* ==========================================================
     SORT
  ========================================================== */

  const [sortField, setSortField] =
    useState<
      | "roleName"
      | "roleCode"
      | "roleType"
      | "createdAt"
      | "updatedAt"
    >("createdAt");

  const [sortDirection, setSortDirection] =
    useState<
      "ASC" | "DESC"
    >("DESC");

  const sortedRoles =
    useMemo(() => {
      const result = [
        ...filteredRoles,
      ];

      result.sort(
        (a, b) => {
          let first = "";
          let second = "";

          switch (sortField) {
            case "roleName":
              first =
                a.roleName ??
                "";
              second =
                b.roleName ??
                "";
              break;

            case "roleCode":
              first =
                a.roleCode ??
                "";
              second =
                b.roleCode ??
                "";
              break;

            case "roleType":
              first =
                a.roleType ??
                "";
              second =
                b.roleType ??
                "";
              break;

            case "createdAt":
              first =
                a.createdAt ??
                "";
              second =
                b.createdAt ??
                "";
              break;

            case "updatedAt":
              first =
                a.updatedAt ??
                "";
              second =
                b.updatedAt ??
                "";
              break;
          }

          const comparison =
            first.localeCompare(
              second,
              undefined,
              {
                numeric: true,
                sensitivity:
                  "base",
              }
            );

          return sortDirection ===
            "ASC"
            ? comparison
            : -comparison;
        }
      );

      return result;
    }, [
      filteredRoles,
      sortField,
      sortDirection,
    ]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalElements =
    sortedRoles.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalElements /
          pageSize
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages - 1
    );

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [
    page,
    safePage,
  ]);

  const paginatedRoles =
    sortedRoles.slice(
      safePage * pageSize,
      safePage * pageSize +
        pageSize
    );

  const startItem =
    totalElements === 0
      ? 0
      : safePage * pageSize + 1;

  const endItem =
    Math.min(
      (safePage + 1) *
        pageSize,
      totalElements
    );

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearch =
    () => {
      setFilters(
        (current) => ({
          ...current,
          search:
            searchInput.trim(),
        })
      );

      setPage(0);
    };

  const clearSearch =
    () => {
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

  const openFilters =
    () => {
      setDraftFilters(
        filters
      );

      setFilterOpen(true);
    };

  const applyFilters =
    () => {
      setFilters(
        draftFilters
      );

      setPage(0);

      setFilterOpen(false);
    };

  const resetFilters =
    () => {
      setDraftFilters(
        DEFAULT_FILTERS
      );
    };

  const clearAllFilters =
    () => {
      setSearchInput("");

      setFilters(
        DEFAULT_FILTERS
      );

      setDraftFilters(
        DEFAULT_FILTERS
      );

      setPage(0);
    };

  /* ==========================================================
     ACTIVE FILTERS
  ========================================================== */

  const activeFilterLabels =
    useMemo(() => {
      const result: string[] =
        [];

      if (filters.search) {
        result.push(
          `Search: ${filters.search}`
        );
      }

      if (
        filters.roleName
      ) {
        result.push(
          `Name: ${filters.roleName}`
        );
      }

      if (
        filters.roleCode
      ) {
        result.push(
          `Code: ${filters.roleCode}`
        );
      }

      if (
        filters.roleType
      ) {
        result.push(
          filters.roleType ===
            "GLOBAL"
            ? "Global"
            : "Tenant"
        );
      }

      if (
        filters.organizationId
      ) {
        result.push(
          `Organization: ${getOrganizationName(
            filters.organizationId,
            organizations
          )}`
        );
      }

      if (
        filters.tenantId
      ) {
        const tenant =
          tenants.find(
            (item) =>
              item.id ===
              filters.tenantId
          );

        result.push(
          `Tenant: ${
            tenant?.tenantName ??
            tenant?.name ??
            filters.tenantId
          }`
        );
      }

      if (
        filters.systemRole !==
        "ALL"
      ) {
        result.push(
          filters.systemRole ===
            "SYSTEM"
            ? "System roles"
            : "Custom roles"
        );
      }

      if (
        filters.status !==
        "ACTIVE"
      ) {
        result.push(
          filters.status ===
            "INACTIVE"
            ? "Inactive"
            : "All"
        );
      }

      if (
        filters.createdFrom
      ) {
        result.push(
          `Created from: ${filters.createdFrom}`
        );
      }

      if (
        filters.createdTo
      ) {
        result.push(
          `Created to: ${filters.createdTo}`
        );
      }

      if (
        filters.updatedFrom
      ) {
        result.push(
          `Updated from: ${filters.updatedFrom}`
        );
      }

      if (
        filters.updatedTo
      ) {
        result.push(
          `Updated to: ${filters.updatedTo}`
        );
      }

      return result;
    }, [
      filters,
      organizations,
      tenants,
    ]);

  /* ==========================================================
     SORT
  ========================================================== */

  const changeSort =
    (
      field:
        | "roleName"
        | "roleCode"
        | "roleType"
        | "createdAt"
        | "updatedAt"
    ) => {
      if (
        sortField === field
      ) {
        setSortDirection(
          (current) =>
            current ===
            "ASC"
              ? "DESC"
              : "ASC"
        );
      } else {
        setSortField(field);

        setSortDirection(
          "ASC"
        );
      }

      setPage(0);
    };

  const SortIcon = ({
    field,
  }: {
    field:
      | "roleName"
      | "roleCode"
      | "roleType"
      | "createdAt"
      | "updatedAt";
  }) => {
    if (
      sortField !== field
    ) {
      return (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
      );
    }

    if (
      sortDirection ===
      "ASC"
    ) {
      return (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      );
    }

    return (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    );
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (
      role: Role
    ) => {
      if (
        role.systemRole
      ) {
        setActionError(
          "System roles cannot be deleted."
        );

        return;
      }

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

        await queryClient.invalidateQueries(
          {
            queryKey: [
              "roles",
            ],
          }
        );
      } catch (
        error: any
      ) {
        setActionError(
          error?.response
            ?.data?.message ??
            "Failed to delete role."
        );
      }
    };

  /* ==========================================================
     VIEW
  ========================================================== */

  const handleView =
    (role: Role) => {
      setSelectedRole(
        role
      );

      setViewOpen(true);
    };

  /* ==========================================================
     COLUMN TOGGLE
  ========================================================== */

  const toggleColumn =
    (
      column: keyof VisibleColumns
    ) => {
      setVisibleColumns(
        (current) => ({
          ...current,
          [column]:
            !current[column],
        })
      );
    };

  /* ==========================================================
     DENSITY
  ========================================================== */

  const rowClass =
    density ===
    "compact"
      ? "h-10"
      : density ===
        "comfortable"
      ? "h-16"
      : "h-12";

  const cardPadding =
    density ===
    "compact"
      ? "p-3"
      : density ===
        "comfortable"
      ? "p-5"
      : "p-4";

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    isLoading &&
    allRoles.length === 0
  ) {
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
     ERROR
  ========================================================== */

  if (isError) {
    return (
      <div className="w-full min-w-0 p-4 sm:p-6">
        <Card>
          <CardContent className="p-6">
            <p className="font-medium text-destructive">
              Failed to load roles
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {(
                error as any
              )?.response
                ?.data?.message ??
                (
                  error as Error
                )?.message ??
                "Unable to load roles."
              }
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

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Roles
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage global and organization-specific access roles.
            </p>
          </div>

          <Button
            onClick={() =>
              navigate(
                "/roles/new"
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Roles
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {allRoles.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Global Roles
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    allRoles.filter(
                      (role) =>
                        role.roleType ===
                        "GLOBAL"
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Globe2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Tenant Roles
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    allRoles.filter(
                      (role) =>
                        role.roleType ===
                        "TENANT"
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  System Roles
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    allRoles.filter(
                      (role) =>
                        role.systemRole
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                <Server className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <Card className="mb-4">
          <CardContent className="p-4">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* SEARCH */}

              <div className="relative min-w-0 flex-1">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={
                    searchInput
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  placeholder="Search roles, code, organization or description..."
                  className="pl-9 pr-9"
                />

                {searchInput && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={
                      clearSearch
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                onClick={
                  handleSearch
                }
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>

              {/* FILTER */}

              <Button
                variant="outline"
                onClick={
                  openFilters
                }
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters

                {activeFilterLabels.length >
                  0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2"
                  >
                    {
                      activeFilterLabels.length
                    }
                  </Badge>
                )}
              </Button>

              {/* REFRESH */}

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  refetch()
                }
                disabled={
                  isFetching
                }
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isFetching
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </Button>

              {/* VIEW */}

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                >
                  <Button
                    variant="outline"
                  >
                    {viewMode ===
                    "table" ? (
                      <Table2 className="mr-2 h-4 w-4" />
                    ) : viewMode ===
                      "list" ? (
                      <List className="mr-2 h-4 w-4" />
                    ) : (
                      <Grid2X2 className="mr-2 h-4 w-4" />
                    )}

                    View

                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

                  <DropdownMenuItem
                    onClick={() =>
                      setViewMode(
                        "table"
                      )
                    }
                  >
                    <Table2 className="mr-2 h-4 w-4" />
                    Table
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      setViewMode(
                        "list"
                      )
                    }
                  >
                    <List className="mr-2 h-4 w-4" />
                    List
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      setViewMode(
                        "card"
                      )
                    }
                  >
                    <Grid2X2 className="mr-2 h-4 w-4" />
                    Cards
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>

              {/* DENSITY */}

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                >
                  <Button
                    variant="outline"
                  >
                    Density
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

                  <DropdownMenuItem
                    onClick={() =>
                      setDensity(
                        "comfortable"
                      )
                    }
                  >
                    Comfortable
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      setDensity(
                        "standard"
                      )
                    }
                  >
                    Standard
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      setDensity(
                        "compact"
                      )
                    }
                  >
                    Compact
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>

              {/* COLUMNS */}

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                >
                  <Button
                    variant="outline"
                  >
                    <Columns3 className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-52"
                >

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.role
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "role"
                      )
                    }
                  >
                    Role
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.code
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "code"
                      )
                    }
                  >
                    Code
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.type
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "type"
                      )
                    }
                  >
                    Type
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.organization
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "organization"
                      )
                    }
                  >
                    Organization
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.tenant
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "tenant"
                      )
                    }
                  >
                    Tenant
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.systemRole
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "systemRole"
                      )
                    }
                  >
                    System Role
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.status
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "status"
                      )
                    }
                  >
                    Status
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.created
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "created"
                      )
                    }
                  >
                    Created
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.updated
                    }
                    onCheckedChange={() =>
                      toggleColumn(
                        "updated"
                      )
                    }
                  >
                    Updated
                  </DropdownMenuCheckboxItem>

                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ACTIVE FILTERS */}

            {activeFilterLabels.length >
              0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">

                <span className="text-xs font-medium text-muted-foreground">
                  Active filters:
                </span>

                {activeFilterLabels.map(
                  (
                    label
                  ) => (
                    <Badge
                      key={
                        label
                      }
                      variant="secondary"
                      className="font-normal"
                    >
                      {label}
                    </Badge>
                  )
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    clearAllFilters
                  }
                >
                  Clear all
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

        {/* =====================================================
            ACTION ERROR
        ===================================================== */}

        {actionError && (
          <Card className="mb-4 border-destructive/30">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm text-destructive">
                {actionError}
              </p>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setActionError(
                    ""
                  )
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* =====================================================
            TABLE VIEW
        ===================================================== */}

        {viewMode ===
          "table" && (
          <Card className="overflow-hidden">

            <div className="w-full overflow-x-auto">

              <Table>

                <TableHeader>
                  <TableRow>

                    {visibleColumns.role && (
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center font-medium"
                          onClick={() =>
                            changeSort(
                              "roleName"
                            )
                          }
                        >
                          Role
                          <SortIcon field="roleName" />
                        </button>
                      </TableHead>
                    )}

                    {visibleColumns.code && (
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center font-medium"
                          onClick={() =>
                            changeSort(
                              "roleCode"
                            )
                          }
                        >
                          Code
                          <SortIcon field="roleCode" />
                        </button>
                      </TableHead>
                    )}

                    {visibleColumns.type && (
                      <TableHead>
                        Type
                      </TableHead>
                    )}

                    {visibleColumns.organization && (
                      <TableHead>
                        Organization
                      </TableHead>
                    )}

                    {visibleColumns.tenant && (
                      <TableHead>
                        Tenant
                      </TableHead>
                    )}

                    {visibleColumns.systemRole && (
                      <TableHead>
                        System
                      </TableHead>
                    )}

                    {visibleColumns.status && (
                      <TableHead>
                        Status
                      </TableHead>
                    )}

                    {visibleColumns.created && (
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center font-medium"
                          onClick={() =>
                            changeSort(
                              "createdAt"
                            )
                          }
                        >
                          Created
                          <SortIcon field="createdAt" />
                        </button>
                      </TableHead>
                    )}

                    {visibleColumns.updated && (
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center font-medium"
                          onClick={() =>
                            changeSort(
                              "updatedAt"
                            )
                          }
                        >
                          Updated
                          <SortIcon field="updatedAt" />
                        </button>
                      </TableHead>
                    )}

                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>

                <TableBody>

                  {paginatedRoles.length ===
                    0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-40 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />

                          <p className="font-medium">
                            No roles found
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Try changing your search or filters.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {paginatedRoles.map(
                    (role) => (
                      <TableRow
                        key={
                          role.id
                        }
                        className={
                          rowClass
                        }
                      >

                        {visibleColumns.role && (
                          <TableCell>
                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                {getInitials(
                                  role.roleName
                                )}
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  className="truncate text-left font-medium hover:underline"
                                  onClick={() =>
                                    handleView(
                                      role
                                    )
                                  }
                                >
                                  {
                                    role.roleName
                                  }
                                </button>

                                <p className="max-w-[300px] truncate text-xs text-muted-foreground">
                                  {role.description ??
                                    "No description"}
                                </p>
                              </div>

                            </div>
                          </TableCell>
                        )}

                        {visibleColumns.code && (
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {
                                role.roleCode
                              }
                            </code>
                          </TableCell>
                        )}

                        {visibleColumns.type && (
                          <TableCell>
                            <RoleTypeBadge
                              roleType={
                                role.roleType
                              }
                            />
                          </TableCell>
                        )}

                        {visibleColumns.organization && (
                          <TableCell>
                            <div className="flex items-center gap-2">

                              <Building2 className="h-4 w-4 text-muted-foreground" />

                              <span className="max-w-[220px] truncate">
                                {getOrganizationName(
                                  role.organizationId,
                                  organizations
                                )}
                              </span>

                            </div>
                          </TableCell>
                        )}

                        {visibleColumns.tenant && (
                          <TableCell>
                            {getTenantName(
                              role.organizationId,
                              organizations,
                              tenants
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.systemRole && (
                          <TableCell>
                            <SystemRoleBadge
                              systemRole={
                                role.systemRole
                              }
                            />
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
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(
                              role.createdAt
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.updated && (
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(
                              role.updatedAt
                            )}
                          </TableCell>
                        )}

                        <TableCell>
                          <RoleActions
                            role={
                              role
                            }
                            onView={() =>
                              handleView(
                                role
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

        {/* =====================================================
            LIST VIEW
        ===================================================== */}

        {viewMode ===
          "list" && (
          <div className="space-y-3">

            {paginatedRoles.length ===
              0 && (
              <Card>
                <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />

                  <p className="font-medium">
                    No roles found
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Try changing your filters.
                  </p>
                </CardContent>
              </Card>
            )}

            {paginatedRoles.map(
              (role) => (
                <Card
                  key={
                    role.id
                  }
                >
                  <CardContent
                    className={
                      cardPadding
                    }
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                      <div className="flex min-w-0 flex-1 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {getInitials(
                            role.roleName
                          )}
                        </div>

                        <div className="min-w-0">

                          <button
                            type="button"
                            className="truncate font-medium hover:underline"
                            onClick={() =>
                              handleView(
                                role
                              )
                            }
                          >
                            {
                              role.roleName
                            }
                          </button>

                          <p className="text-xs text-muted-foreground">
                            {
                              role.roleCode
                            }
                          </p>

                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-2">

                        <RoleTypeBadge
                          roleType={
                            role.roleType
                          }
                        />

                        <SystemRoleBadge
                          systemRole={
                            role.systemRole
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

                      <div className="flex min-w-[180px] items-center gap-2 text-sm text-muted-foreground">

                        <Building2 className="h-4 w-4" />

                        <span className="truncate">
                          {getOrganizationName(
                            role.organizationId,
                            organizations
                          )}
                        </span>

                      </div>

                      <div className="text-sm text-muted-foreground">
                        {formatDate(
                          role.createdAt
                        )}
                      </div>

                      <RoleActions
                        role={
                          role
                        }
                        onView={() =>
                          handleView(
                            role
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
                      />

                    </div>

                  </CardContent>
                </Card>
              )
            )}

          </div>
        )}

        {/* =====================================================
            CARD VIEW
        ===================================================== */}

        {viewMode ===
          "card" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {paginatedRoles.length ===
              0 && (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />

                  <p className="font-medium">
                    No roles found
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Try changing your filters.
                  </p>
                </CardContent>
              </Card>
            )}

            {paginatedRoles.map(
              (role) => (
                <Card
                  key={
                    role.id
                  }
                  className="transition-shadow hover:shadow-md"
                >

                  <CardHeader className="pb-3">

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                          {getInitials(
                            role.roleName
                          )}
                        </div>

                        <div className="min-w-0">

                          <button
                            type="button"
                            className="truncate text-left font-semibold hover:underline"
                            onClick={() =>
                              handleView(
                                role
                              )
                            }
                          >
                            {
                              role.roleName
                            }
                          </button>

                          <code className="text-xs text-muted-foreground">
                            {
                              role.roleCode
                            }
                          </code>

                        </div>

                      </div>

                      <RoleActions
                        role={
                          role
                        }
                        onView={() =>
                          handleView(
                            role
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
                      />

                    </div>

                  </CardHeader>

                  <CardContent className="space-y-4">

                    <p className="min-h-[40px] text-sm text-muted-foreground">
                      {role.description ??
                        "No description provided."}
                    </p>

                    <div className="flex flex-wrap gap-2">

                      <RoleTypeBadge
                        roleType={
                          role.roleType
                        }
                      />

                      <SystemRoleBadge
                        systemRole={
                          role.systemRole
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

                    <div className="space-y-2 border-t pt-3">

                      <div className="flex items-center justify-between gap-3 text-sm">

                        <span className="text-muted-foreground">
                          Organization
                        </span>

                        <span className="max-w-[180px] truncate font-medium">
                          {getOrganizationName(
                            role.organizationId,
                            organizations
                          )}
                        </span>

                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">

                        <span className="text-muted-foreground">
                          Tenant
                        </span>

                        <span className="max-w-[180px] truncate font-medium">
                          {getTenantName(
                            role.organizationId,
                            organizations,
                            tenants
                          )}
                        </span>

                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">

                        <span className="text-muted-foreground">
                          Created
                        </span>

                        <span>
                          {formatDate(
                            role.createdAt
                          )}
                        </span>

                      </div>

                    </div>

                  </CardContent>
                </Card>
              )
            )}

          </div>
        )}

        {/* =====================================================
            PAGINATION
        ===================================================== */}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm text-muted-foreground">
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
            roles
          </div>

          <div className="flex items-center gap-2">

            <Select
              value={String(
                pageSize
              )}
              onValueChange={(
                value
              ) => {
                setPageSize(
                  Number(
                    value
                  )
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
                safePage === 0
              }
              onClick={() =>
                setPage(
                  (
                    current
                  ) =>
                    Math.max(
                      current -
                        1,
                      0
                    )
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[80px] text-center text-sm">
              Page{" "}
              <span className="font-medium">
                {safePage + 1}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={
                safePage >=
                totalPages - 1
              }
              onClick={() =>
                setPage(
                  (
                    current
                  ) =>
                    Math.min(
                      current +
                        1,
                      totalPages -
                        1
                    )
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

          </div>
        </div>

      </div>

      {/* =======================================================
          FILTER SHEET
      ======================================================= */}

      <Sheet
        open={filterOpen}
        onOpenChange={
          setFilterOpen
        }
      >

        <SheetContent className="w-full overflow-y-auto sm:max-w-md">

          <SheetHeader>
            <SheetTitle>
              Role Filters
            </SheetTitle>

            <SheetDescription>
              Filter roles by scope, tenant, organization, status and dates.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">

            {/* ROLE NAME */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role Name
              </label>

              <Input
                value={
                  draftFilters.roleName
                }
                onChange={(
                  event
                ) =>
                  setDraftFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      roleName:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="e.g. HR Admin"
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
                onChange={(
                  event
                ) =>
                  setDraftFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      roleCode:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="e.g. HR_ADMIN"
              />
            </div>

            {/* ROLE TYPE */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role Type
              </label>

              <Select
                value={
                  draftFilters.roleType ||
                  "ALL"
                }
                onValueChange={(
                  value
                ) =>
                  setDraftFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      roleType:
                        value ===
                        "ALL"
                          ? ""
                          : (value as RoleType),
                    })
                  )
                }
              >

                <SelectTrigger>
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="ALL">
                    All Role Types
                  </SelectItem>

                  <SelectItem value="GLOBAL">
                    Global
                  </SelectItem>

                  <SelectItem value="TENANT">
                    Tenant
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
                onValueChange={(
                  value
                ) =>
                  setDraftFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      tenantId:
                        value ===
                        "ALL"
                          ? ""
                          : value,

                      /*
                       * Organization belongs to
                       * a tenant. Clear organization
                       * when tenant changes to avoid
                       * inconsistent filters.
                       */
                      organizationId:
                        "",
                    })
                  )
                }
              >

                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="ALL">
                    All Tenants
                  </SelectItem>

                  {tenants.map(
                    (
                      tenant
                    ) => (
                      <SelectItem
                        key={
                          tenant.id
                        }
                        value={
                          tenant.id
                        }
                      >
                        {tenant.tenantName ??
                          tenant.name ??
                          tenant.id}
                      </SelectItem>
                    )
                  )}

                </SelectContent>

              </Select>

              {tenants.length ===
                0 && (
                <p className="text-xs text-muted-foreground">
                  Tenant data is not available from the tenant API. Tenant filtering will use organization tenantId when available.
                </p>
              )}
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
                onValueChange={(
                  value
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
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="ALL">
                    All Organizations
                  </SelectItem>

                  {organizations
                    .filter(
                      (
                        organization
                      ) => {
                        if (
                          !draftFilters.tenantId
                        ) {
                          return true;
                        }

                        return (
                          organization.tenantId ===
                            draftFilters.tenantId ||
                          !organization.tenantId
                        );
                      }
                    )
                    .map(
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
                          {organization.orgName ??
                            organization.name ??
                            organization.id}
                        </SelectItem>
                      )
                    )}

                </SelectContent>

              </Select>
            </div>

            {/* SYSTEM ROLE */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role Category
              </label>

              <Select
                value={
                  draftFilters.systemRole
                }
                onValueChange={(
                  value
                ) =>
                  setDraftFilters(
                    (
                      current
                    ) => ({
                      ...current,
                      systemRole:
                        value as RoleFilters["systemRole"],
                    })
                  )
                }
              >

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="ALL">
                    All Roles
                  </SelectItem>

                  <SelectItem value="SYSTEM">
                    System Roles
                  </SelectItem>

                  <SelectItem value="CUSTOM">
                    Custom Roles
                  </SelectItem>

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
                  value
                ) =>
                  setDraftFilters(
                    (
                      current
                    ) => ({
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

                  <SelectItem value="ALL">
                    All
                  </SelectItem>

                </SelectContent>

              </Select>
            </div>

            {/* CREATED DATE */}

            <div className="space-y-3">

              <label className="text-sm font-medium">
                Created Date
              </label>

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    From
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

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    To
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

            </div>

            {/* UPDATED DATE */}

            <div className="space-y-3">

              <label className="text-sm font-medium">
                Updated Date
              </label>

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    From
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

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    To
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

          </div>

          <SheetFooter className="mt-8">

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

      {/* =======================================================
          VIEW ROLE SHEET
      ======================================================= */}

      <Sheet
        open={viewOpen}
        onOpenChange={
          setViewOpen
        }
      >

        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">

          <SheetHeader>

            <SheetTitle>
              Role Details
            </SheetTitle>

            <SheetDescription>
              View role configuration and scope information.
            </SheetDescription>

          </SheetHeader>

          {selectedRole && (
            <div className="mt-6 space-y-6">

              {/* ROLE HEADER */}

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                  {getInitials(
                    selectedRole.roleName
                  )}
                </div>

                <div className="min-w-0">

                  <h2 className="truncate text-xl font-semibold">
                    {
                      selectedRole.roleName
                    }
                  </h2>

                  <code className="text-sm text-muted-foreground">
                    {
                      selectedRole.roleCode
                    }
                  </code>

                </div>

              </div>

              {/* BADGES */}

              <div className="flex flex-wrap gap-2">

                <RoleTypeBadge
                  roleType={
                    selectedRole.roleType
                  }
                />

                <SystemRoleBadge
                  systemRole={
                    selectedRole.systemRole
                  }
                />

                <StatusBadge
                  active={
                    selectedRole.active
                  }
                  deleted={
                    selectedRole.deleted
                  }
                />

              </div>

              {/* DESCRIPTION */}

              <div className="space-y-2">

                <h3 className="text-sm font-medium">
                  Description
                </h3>

                <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  {selectedRole.description ??
                    "No description provided."}
                </div>

              </div>

              {/* SCOPE */}

              <div className="space-y-3">

                <h3 className="text-sm font-medium">
                  Scope
                </h3>

                <div className="rounded-lg border">

                  <div className="flex items-center justify-between border-b p-3">
                    <span className="text-sm text-muted-foreground">
                      Role Type
                    </span>

                    <RoleTypeBadge
                      roleType={
                        selectedRole.roleType
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between border-b p-3">

                    <span className="text-sm text-muted-foreground">
                      Organization
                    </span>

                    <span className="max-w-[220px] truncate text-right text-sm font-medium">
                      {getOrganizationName(
                        selectedRole.organizationId,
                        organizations
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between p-3">

                    <span className="text-sm text-muted-foreground">
                      Tenant
                    </span>

                    <span className="max-w-[220px] truncate text-right text-sm font-medium">
                      {getTenantName(
                        selectedRole.organizationId,
                        organizations,
                        tenants
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* AUDIT */}

              <div className="space-y-3">

                <h3 className="text-sm font-medium">
                  Audit Information
                </h3>

                <div className="rounded-lg border">

                  <div className="flex items-center justify-between border-b p-3">

                    <span className="text-sm text-muted-foreground">
                      Created
                    </span>

                    <span className="text-right text-sm">
                      {formatDateTime(
                        selectedRole.createdAt
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between border-b p-3">

                    <span className="text-sm text-muted-foreground">
                      Updated
                    </span>

                    <span className="text-right text-sm">
                      {formatDateTime(
                        selectedRole.updatedAt
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between p-3">

                    <span className="text-sm text-muted-foreground">
                      Role ID
                    </span>

                    <code className="max-w-[230px] truncate text-xs">
                      {
                        selectedRole.id
                      }
                    </code>

                  </div>

                </div>

              </div>

              {/* EDIT */}

              {!selectedRole.systemRole &&
                !selectedRole.deleted && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setViewOpen(
                        false
                      );

                      navigate(
                        `/roles/${selectedRole.id}/edit`
                      );
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Role
                  </Button>
                )}

            </div>
          )}

        </SheetContent>

      </Sheet>

    </div>
  );
}