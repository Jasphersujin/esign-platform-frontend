import React, { useMemo, useState } from "react";

import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UsersRound,
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

interface Organization {
  id: string;
  organizationName: string;
  name?: string;
  active: boolean;
  deleted: boolean;
}

interface UserRole {
  id?: string;
  roleName?: string;
  name?: string;
  displayName?: string;
}

interface User {
  id: string;

  firstName?: string | null;
  lastName?: string | null;

  fullName?: string | null;

  email: string;

  username?: string | null;

  phoneNumber?: string | null;

  organizationId?: string | null;

  organizationName?: string | null;

  organization?: Organization | null;

  roles?: UserRole[];

  roleName?: string | null;

  active: boolean;

  deleted: boolean;

  createdAt?: string | null;

  updatedAt?: string | null;

  lastLoginAt?: string | null;

  version?: number;
}

interface UserPageResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

interface OrganizationPageResponse {
  content: Organization[];
  totalElements: number;
  totalPages: number;
}

type ViewMode = "table" | "list" | "card";

type ColumnKey =
  | "user"
  | "organization"
  | "role"
  | "status"
  | "lastLogin"
  | "created"
  | "updated"
  | "actions";

const DEFAULT_VISIBLE_COLUMNS: Record<
  ColumnKey,
  boolean
> = {
  user: true,
  organization: true,
  role: true,
  status: true,
  lastLogin: true,
  created: true,
  updated: false,
  actions: true,
};

const formatDate = (
  value?: string | null
): string => {
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

const formatDateTime = (
  value?: string | null
): string => {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getUserName = (user: User): string => {
  if (user.fullName?.trim()) {
    return user.fullName.trim();
  }

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || user.email;
};

const getInitials = (value: string): string => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getOrganizationName = (
  user: User
): string => {
  return (
    user.organizationName ??
    user.organization?.organizationName ??
    user.organization?.name ??
    "-"
  );
};

const getRoleNames = (user: User): string[] => {
  if (
    user.roles &&
    Array.isArray(user.roles) &&
    user.roles.length > 0
  ) {
    return user.roles
      .map(
        (role) =>
          role.displayName ??
          role.roleName ??
          role.name
      )
      .filter(
        (role): role is string =>
          Boolean(role)
      );
  }

  if (user.roleName) {
    return [user.roleName];
  }

  return [];
};

const UsersPage = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState<string>("");

  const [organizationId, setOrganizationId] =
    useState<string>("all");

  const [status, setStatus] =
    useState<string>("active");

  const [roleFilter, setRoleFilter] =
    useState<string>("all");

  const [page, setPage] =
    useState<number>(0);

  const [pageSize, setPageSize] =
    useState<number>(10);

  const [viewMode, setViewMode] =
    useState<ViewMode>(() => {
      const saved = localStorage.getItem(
        "users-view-mode"
      );

      if (
        saved === "table" ||
        saved === "list" ||
        saved === "card"
      ) {
        return saved;
      }

      return "table";
    });

  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColumnKey, boolean>>(
      () => {
        try {
          const saved =
            localStorage.getItem(
              "users-visible-columns"
            );

          if (saved) {
            return {
              ...DEFAULT_VISIBLE_COLUMNS,
              ...JSON.parse(saved),
            };
          }
        } catch {
          // Ignore invalid localStorage.
        }

        return DEFAULT_VISIBLE_COLUMNS;
      }
    );

  const [filterSheetOpen, setFilterSheetOpen] =
    useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] =
    useState<User | null>(null);

  const [actionLoading, setActionLoading] =
    useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  /*
   * --------------------------------------------------
   * Organizations
   * --------------------------------------------------
   */

  const {
    data: organizationData,
    isLoading: isLoadingOrganizations,
  } = useQuery<OrganizationPageResponse>({
    queryKey: ["organizations", "user-filter"],

    queryFn: async () => {
      const response =
        await api.get<OrganizationPageResponse>(
          "/api/v1/organizations/search",
          {
            params: {
              page: 0,
              size: 100,
              active: true,
              includeDeleted: false,
              sortBy: "organizationName",
              sortDirection: "ASC",
            },
          }
        );

      return response.data;
    },
  });

  const organizations =
    organizationData?.content ?? [];

  /*
   * --------------------------------------------------
   * Users
   * --------------------------------------------------
   */

  const queryKey = useMemo(
    () => [
      "users",
      search,
      organizationId,
      status,
      roleFilter,
      page,
      pageSize,
    ],
    [
      search,
      organizationId,
      status,
      roleFilter,
      page,
      pageSize,
    ]
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<UserPageResponse>({
    queryKey,

    queryFn: async () => {
      const params: Record<
        string,
        string | number | boolean
      > = {
        page,
        size: pageSize,
        sortBy: "createdAt",
        sortDirection: "DESC",
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (organizationId !== "all") {
        params.organizationId =
          organizationId;
      }

      if (status === "active") {
        params.active = true;
        params.deleted = false;
      }

      if (status === "inactive") {
        params.active = false;
        params.deleted = false;
      }

      if (status === "deleted") {
        params.deleted = true;
      }

      if (roleFilter !== "all") {
        params.role = roleFilter;
      }

      const response =
        await api.get<UserPageResponse>(
          "/api/v1/users/search",
          {
            params,
          }
        );

      return response.data;
    },

    placeholderData: keepPreviousData,
  });

  const users = data?.content ?? [];

  const totalElements =
    data?.totalElements ?? 0;

  const totalPages =
    data?.totalPages ?? 0;

  const startItem =
    totalElements === 0
      ? 0
      : page * pageSize + 1;

  const endItem = Math.min(
    (page + 1) * pageSize,
    totalElements
  );

  /*
   * --------------------------------------------------
   * Helpers
   * --------------------------------------------------
   */

  const updateViewMode = (
    mode: ViewMode
  ): void => {
    setViewMode(mode);

    localStorage.setItem(
      "users-view-mode",
      mode
    );
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
      "users-visible-columns",
      JSON.stringify(next)
    );
  };

  const resetFilters = (): void => {
    setOrganizationId("all");
    setStatus("active");
    setRoleFilter("all");
    setSearch("");
    setPage(0);
  };

  const activeFilterCount =
    Number(organizationId !== "all") +
    Number(status !== "active") +
    Number(roleFilter !== "all");

  /*
   * --------------------------------------------------
   * Delete
   * --------------------------------------------------
   */

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    try {
      setActionLoading(true);

      setErrorMessage("");

      await api.delete(
        `/api/v1/users/${deleteTarget.id}`
      );

      setDeleteTarget(null);

      await queryClient.invalidateQueries({
        queryKey: ["users"],
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
          "Failed to delete user."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * --------------------------------------------------
   * Status
   * --------------------------------------------------
   */

  const renderStatus = (user: User) => {
    if (user.deleted) {
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

    if (user.active) {
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
        className="text-muted-foreground"
      >
        Inactive
      </Badge>
    );
  };

  /*
   * --------------------------------------------------
   * Actions
   * --------------------------------------------------
   */

  const renderActions = (user: User) => {
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
              navigate(
                `/users/${user.id}`
              )
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>

          {!user.deleted && (
            <DropdownMenuItem
              onClick={() =>
                navigate(
                  `/users/${user.id}/edit`
                )
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          {!user.deleted && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  setDeleteTarget(user)
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /*
   * --------------------------------------------------
   * User Info
   * --------------------------------------------------
   */

  const renderUserInfo = (user: User) => {
    const name = getUserName(user);

    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {getInitials(name)}
        </div>

        <div className="min-w-0">
          <button
            type="button"
            className="block max-w-[250px] truncate text-left text-sm font-medium hover:underline"
            onClick={() =>
              navigate(
                `/users/${user.id}`
              )
            }
          >
            {name}
          </button>

          <p className="max-w-[250px] truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>
    );
  };

  /*
   * --------------------------------------------------
   * Roles
   * --------------------------------------------------
   */

  const renderRoles = (
    user: User
  ) => {
    const roles = getRoleNames(user);

    if (roles.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          No role
        </span>
      );
    }

    return (
      <div className="flex max-w-[220px] flex-wrap gap-1">
        {roles.slice(0, 2).map((role) => (
          <Badge
            key={role}
            variant="secondary"
            className="text-xs"
          >
            {role}
          </Badge>
        ))}

        {roles.length > 2 && (
          <Badge
            variant="outline"
            className="text-xs"
          >
            +{roles.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  /*
   * --------------------------------------------------
   * Table
   * --------------------------------------------------
   */

  const renderTable = () => {
    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.user && (
                <TableHead>
                  User
                </TableHead>
              )}

              {visibleColumns.organization && (
                <TableHead>
                  Organization
                </TableHead>
              )}

              {visibleColumns.role && (
                <TableHead>
                  Role
                </TableHead>
              )}

              {visibleColumns.status && (
                <TableHead>
                  Status
                </TableHead>
              )}

              {visibleColumns.lastLogin && (
                <TableHead>
                  Last Login
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
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <UsersRound className="mb-2 h-8 w-8 text-muted-foreground/50" />

                    <p className="text-sm font-medium">
                      No users found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Try changing your search or filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className={
                    user.deleted
                      ? "opacity-60"
                      : undefined
                  }
                >
                  {visibleColumns.user && (
                    <TableCell>
                      {renderUserInfo(user)}
                    </TableCell>
                  )}

                  {visibleColumns.organization && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                          {getInitials(
                            getOrganizationName(
                              user
                            )
                          )}
                        </div>

                        <span className="max-w-[180px] truncate text-sm">
                          {getOrganizationName(
                            user
                          )}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.role && (
                    <TableCell>
                      {renderRoles(user)}
                    </TableCell>
                  )}

                  {visibleColumns.status && (
                    <TableCell>
                      {renderStatus(user)}
                    </TableCell>
                  )}

                  {visibleColumns.lastLogin && (
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(
                        user.lastLoginAt
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.created && (
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(
                        user.createdAt
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.updated && (
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(
                        user.updatedAt
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.actions && (
                    <TableCell>
                      {renderActions(user)}
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

  /*
   * --------------------------------------------------
   * List View
   * --------------------------------------------------
   */

  const renderList = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading users...
          </CardContent>
        </Card>
      );
    }

    if (users.length === 0) {
      return (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center">
            <UsersRound className="mb-2 h-8 w-8 text-muted-foreground/50" />

            <p className="text-sm font-medium">
              No users found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try changing your search or filters.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {users.map((user) => {
          const name = getUserName(user);

          return (
            <Card
              key={user.id}
              className={
                user.deleted
                  ? "opacity-60"
                  : undefined
              }
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="truncate text-sm font-medium hover:underline"
                      onClick={() =>
                        navigate(
                          `/users/${user.id}`
                        )
                      }
                    >
                      {name}
                    </button>

                    {renderStatus(user)}
                  </div>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Organization:{" "}
                      {getOrganizationName(
                        user
                      )}
                    </span>

                    <span>
                      Last login:{" "}
                      {formatDate(
                        user.lastLoginAt
                      )}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block">
                  {renderRoles(user)}
                </div>

                {renderActions(user)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  /*
   * --------------------------------------------------
   * Card View
   * --------------------------------------------------
   */

  const renderCards = () => {
    if (isLoading) {
      return (
        <Card className="col-span-full">
          <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading users...
          </CardContent>
        </Card>
      );
    }

    if (users.length === 0) {
      return (
        <Card className="col-span-full">
          <CardContent className="flex h-40 flex-col items-center justify-center">
            <UsersRound className="mb-2 h-8 w-8 text-muted-foreground/50" />

            <p className="text-sm font-medium">
              No users found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try changing your search or filters.
            </p>
          </CardContent>
        </Card>
      );
    }

    return users.map((user) => {
      const name = getUserName(user);

      return (
        <Card
          key={user.id}
          className={
            user.deleted
              ? "opacity-60"
              : undefined
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(name)}
                </div>

                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {name}
                  </CardTitle>

                  <CardDescription className="truncate">
                    {user.email}
                  </CardDescription>
                </div>
              </div>

              {renderActions(user)}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Organization
              </p>

              <p className="truncate text-sm font-medium">
                {getOrganizationName(user)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Roles
              </p>

              {renderRoles(user)}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Status
                </p>

                <div className="mt-1">
                  {renderStatus(user)}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Last Login
                </p>

                <p className="mt-1 text-xs">
                  {formatDate(
                    user.lastLoginAt
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-muted-foreground" />

              <h1 className="text-2xl font-semibold tracking-tight">
                Users
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage users across all organizations in
              your system.
            </p>
          </div>

          <Button
            onClick={() =>
              navigate("/users/new")
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{errorMessage}</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setErrorMessage("")
              }
            >
              Dismiss
            </Button>
          </div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <div>
                <CardTitle>
                  User Management
                </CardTitle>

                <CardDescription>
                  Search and manage users based on
                  organization, role, and account status.
                </CardDescription>
              </div>

              {/* Organization Filter */}
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_auto] md:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Organization
                    </label>

                    <Select
                      value={organizationId}
                      onValueChange={(value) => {
                        setOrganizationId(value);
                        setPage(0);
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="all">
                          All Organizations
                        </SelectItem>

                        {isLoadingOrganizations ? (
                          <SelectItem
                            value="loading"
                            disabled
                          >
                            Loading organizations...
                          </SelectItem>
                        ) : (
                          organizations.map(
                            (organization) => (
                              <SelectItem
                                key={
                                  organization.id
                                }
                                value={
                                  organization.id
                                }
                              >
                                {
                                  organization.organizationName
                                }
                              </SelectItem>
                            )
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {organizationId !== "all" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UsersRound className="h-4 w-4" />

                      <span>
                        Showing users for{" "}
                        <span className="font-medium text-foreground">
                          {
                            organizations.find(
                              (organization) =>
                                organization.id ===
                                organizationId
                            )
                              ?.organizationName
                          }
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Search + Controls */}
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(
                        event.target.value
                      );
                      setPage(0);
                    }}
                    placeholder="Search by name, email or username..."
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filters */}
                  <Sheet
                    open={filterSheetOpen}
                    onOpenChange={
                      setFilterSheetOpen
                    }
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
                          Filter Users
                        </SheetTitle>

                        <SheetDescription>
                          Refine the users displayed in
                          the list.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {/* Organization */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Organization
                          </label>

                          <Select
                            value={
                              organizationId
                            }
                            onValueChange={(
                              value
                            ) => {
                              setOrganizationId(
                                value
                              );
                              setPage(0);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="all">
                                All Organizations
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
                                      organization.organizationName
                                    }
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Status
                          </label>

                          <Select
                            value={status}
                            onValueChange={(
                              value
                            ) => {
                              setStatus(value);
                              setPage(0);
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

                        {/* Role */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Role
                          </label>

                          <Input
                            value={
                              roleFilter ===
                              "all"
                                ? ""
                                : roleFilter
                            }
                            onChange={(event) => {
                              const value =
                                event.target
                                  .value;

                              setRoleFilter(
                                value.trim() ||
                                  "all"
                              );

                              setPage(0);
                            }}
                            placeholder="Filter by role..."
                          />

                          <p className="text-xs text-muted-foreground">
                            Enter a role name to filter
                            users.
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={
                            resetFilters
                          }
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
                    onClick={() =>
                      refetch()
                    }
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
                    <DropdownMenuTrigger
                      asChild
                    >
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
                        checked={
                          visibleColumns.user
                        }
                        onCheckedChange={(
                          checked
                        ) =>
                          updateColumn(
                            "user",
                            checked
                          )
                        }
                      >
                        User
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.organization
                        }
                        onCheckedChange={(
                          checked
                        ) =>
                          updateColumn(
                            "organization",
                            checked
                          )
                        }
                      >
                        Organization
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.role
                        }
                        onCheckedChange={(
                          checked
                        ) =>
                          updateColumn(
                            "role",
                            checked
                          )
                        }
                      >
                        Role
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.status
                        }
                        onCheckedChange={(
                          checked
                        ) =>
                          updateColumn(
                            "status",
                            checked
                          )
                        }
                      >
                        Status
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.lastLogin
                        }
                        onCheckedChange={(
                          checked
                        ) =>
                          updateColumn(
                            "lastLogin",
                            checked
                          )
                        }
                      >
                        Last Login
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.created
                        }
                        onCheckedChange={(
                          checked
                        ) =>
                          updateColumn(
                            "created",
                            checked
                          )
                        }
                      >
                        Created
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuCheckboxItem
                        checked={
                          visibleColumns.updated
                        }
                        onCheckedChange={(
                          checked
                        ) =>
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

                  {/* View Mode */}
                  <div className="hidden items-center rounded-md border p-1 sm:flex">
                    <Button
                      type="button"
                      variant={
                        viewMode ===
                        "table"
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateViewMode(
                          "table"
                        )
                      }
                    >
                      <List className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant={
                        viewMode ===
                        "list"
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateViewMode(
                          "list"
                        )
                      }
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant={
                        viewMode ===
                        "card"
                          ? "secondary"
                          : "ghost"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateViewMode(
                          "card"
                        )
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
                users
              </div>

              <div className="flex items-center gap-3">
                {/* Page Size */}
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    Rows
                  </span>

                  <Select
                    value={String(
                      pageSize
                    )}
                    onValueChange={(
                      value
                    ) => {
                      setPageSize(
                        Number(value)
                      );
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

                {/* Pagination */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      page === 0 ||
                      isFetching
                    }
                    onClick={() =>
                      setPage((prev) =>
                        Math.max(
                          0,
                          prev - 1
                        )
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="min-w-[70px] text-center text-xs text-muted-foreground">
                    Page{" "}
                    {totalPages === 0
                      ? 0
                      : page + 1}{" "}
                    of {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      page >=
                        totalPages - 1 ||
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
          if (
            !open &&
            !actionLoading
          ) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete User?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget
                  ? getUserName(
                      deleteTarget
                    )
                  : ""}
              </span>
              ? The user will be soft deleted and
              will no longer be available as an
              active user.
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
    </div>
  );
};

export default UsersPage;