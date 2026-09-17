import React, {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  LayoutGrid,
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
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

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
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

/* ============================================================
   TYPES
============================================================ */

interface Action {
  id: string;
  name: string;
  actionCode: string;
  description?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  version?: number;
}

interface ActionPageResponse {
  content: Action[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

type ViewMode =
  | "table"
  | "list"
  | "card";

type ColumnKey =
  | "name"
  | "actionCode"
  | "description"
  | "status"
  | "created"
  | "updated"
  | "actions";

interface VisibleColumns {
  name: boolean;
  actionCode: boolean;
  description: boolean;
  status: boolean;
  created: boolean;
  updated: boolean;
  actions: boolean;
}

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_COLUMNS: VisibleColumns = {
  name: true,
  actionCode: true,
  description: true,
  status: true,
  created: true,
  updated: false,
  actions: true,
};

/* ============================================================
   HELPERS
============================================================ */

const formatDate = (
  value?: string | null
): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
};

const getInitials = (
  value: string
): string => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "AC";
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`
    .toUpperCase();
};

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
        className="gap-1 text-destructive"
      >
        <Trash2 className="h-3 w-3" />
        Deleted
      </Badge>
    );
  }

  if (active) {
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
}

/* ============================================================
   ACTION MENU
============================================================ */

interface ActionMenuProps {
  action: Action;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

function ActionMenu({
  action,
  onView,
  onEdit,
  onDelete,
  onRestore,
}: ActionMenuProps) {
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

        {!action.deleted && (
          <DropdownMenuItem
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {action.deleted ? (
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

const ActionsPage = () => {
  const navigate = useNavigate();

  const queryClient =
    useQueryClient();

  const [search, setSearch] =
    useState<string>("");

  const [page, setPage] =
    useState<number>(0);

  const [pageSize, setPageSize] =
    useState<number>(10);

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  const [visibleColumns, setVisibleColumns] =
    useState<VisibleColumns>(
      DEFAULT_COLUMNS
    );

  const [deleteTarget, setDeleteTarget] =
    useState<Action | null>(null);

  const [restoreTarget, setRestoreTarget] =
    useState<Action | null>(null);

  const [actionLoading, setActionLoading] =
    useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  const queryKey = useMemo(
    () => [
      "actions",
      search,
      page,
      pageSize,
    ],
    [
      search,
      page,
      pageSize,
    ]
  );

  /* ==========================================================
     FETCH
  ========================================================== */

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ActionPageResponse>({
    queryKey,

    queryFn: async () => {
      const response =
        await api.get<ActionPageResponse>(
          "/api/v1/actions/search",
          {
            params: {
              page,
              size: pageSize,
              search:
                search.trim() ||
                undefined,
              active: true,
              deleted: false,
              sortBy: "createdAt",
              sortDirection: "DESC",
            },
          }
        );

      return response.data;
    },

    placeholderData:
      keepPreviousData,
  });

  const actions =
    data?.content ?? [];

  const totalElements =
    data?.totalElements ?? 0;

  const totalPages =
    data?.totalPages ?? 0;

  const startItem =
    totalElements === 0
      ? 0
      : page * pageSize + 1;

  const endItem =
    Math.min(
      (page + 1) * pageSize,
      totalElements
    );

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (): Promise<void> => {
      if (!deleteTarget) {
        return;
      }

      try {
        setActionLoading(true);
        setErrorMessage("");

        await api.delete(
          `/api/v1/actions/${deleteTarget.id}`
        );

        setDeleteTarget(null);

        await queryClient.invalidateQueries({
          queryKey: ["actions"],
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
            "Failed to delete action."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ==========================================================
     RESTORE
  ========================================================== */

  const handleRestore =
    async (): Promise<void> => {
      if (!restoreTarget) {
        return;
      }

      try {
        setActionLoading(true);
        setErrorMessage("");

        await api.put(
          `/api/v1/actions/${restoreTarget.id}/restore`
        );

        setRestoreTarget(null);

        await queryClient.invalidateQueries({
          queryKey: ["actions"],
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
            "Failed to restore action."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading actions...
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

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Actions
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage system actions and action codes.
            </p>
          </div>

          <Button
            onClick={() =>
              navigate("/actions/add")
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Action
          </Button>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* TOOLBAR */}

        <Card className="mb-4">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(0);
                }}
                placeholder="Search actions..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">

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

                <DropdownMenuContent align="end">

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.name
                    }
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        (prev) => ({
                          ...prev,
                          name: checked,
                        })
                      )
                    }
                  >
                    Name
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.actionCode
                    }
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        (prev) => ({
                          ...prev,
                          actionCode: checked,
                        })
                      )
                    }
                  >
                    Action Code
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.description
                    }
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        (prev) => ({
                          ...prev,
                          description: checked,
                        })
                      )
                    }
                  >
                    Description
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.status
                    }
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        (prev) => ({
                          ...prev,
                          status: checked,
                        })
                      )
                    }
                  >
                    Status
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.created
                    }
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        (prev) => ({
                          ...prev,
                          created: checked,
                        })
                      )
                    }
                  >
                    Created
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuCheckboxItem
                    checked={
                      visibleColumns.updated
                    }
                    onCheckedChange={(checked) =>
                      setVisibleColumns(
                        (prev) => ({
                          ...prev,
                          updated: checked,
                        })
                      )
                    }
                  >
                    Updated
                  </DropdownMenuCheckboxItem>

                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                >
                  <Button
                    variant="outline"
                    size="icon"
                  >
                    <Table2 className="h-4 w-4" />
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
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Cards
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>

            </div>

          </CardContent>
        </Card>

        {/* CONTENT */}

        {viewMode === "table" && (
          <Card>

            <CardContent className="p-0">

              <div className="overflow-x-auto">

                <Table>

                  <TableHeader>
                    <TableRow>

                      {visibleColumns.name && (
                        <TableHead>
                          Name
                        </TableHead>
                      )}

                      {visibleColumns.actionCode && (
                        <TableHead>
                          Action Code
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
                        <TableHead className="text-right">
                          Actions
                        </TableHead>
                      )}

                    </TableRow>
                  </TableHeader>

                  <TableBody>

                    {actions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-32 text-center text-muted-foreground"
                        >
                          No actions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      actions.map(
                        (action) => (
                          <TableRow
                            key={
                              action.id
                            }
                          >

                            {visibleColumns.name && (
                              <TableCell>

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                    {getInitials(
                                      action.name
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-medium">
                                      {
                                        action.name
                                      }
                                    </p>
                                  </div>

                                </div>

                              </TableCell>
                            )}

                            {visibleColumns.actionCode && (
                              <TableCell>
                                <code className="rounded bg-muted px-2 py-1 text-xs">
                                  {
                                    action.actionCode
                                  }
                                </code>
                              </TableCell>
                            )}

                            {visibleColumns.description && (
                              <TableCell>
                                <p className="max-w-[320px] truncate text-sm text-muted-foreground">
                                  {
                                    action.description ||
                                    "-"
                                  }
                                </p>
                              </TableCell>
                            )}

                            {visibleColumns.status && (
                              <TableCell>
                                <StatusBadge
                                  active={
                                    action.active
                                  }
                                  deleted={
                                    action.deleted
                                  }
                                />
                              </TableCell>
                            )}

                            {visibleColumns.created && (
                              <TableCell>
                                {
                                  formatDate(
                                    action.createdAt
                                  )
                                }
                              </TableCell>
                            )}

                            {visibleColumns.updated && (
                              <TableCell>
                                {
                                  formatDate(
                                    action.updatedAt
                                  )
                                }
                              </TableCell>
                            )}

                            {visibleColumns.actions && (
                              <TableCell className="text-right">

                                <ActionMenu
                                  action={
                                    action
                                  }
                                  onView={() =>
                                    navigate(
                                      `/actions/${action.id}`
                                    )
                                  }
                                  onEdit={() =>
                                    navigate(
                                      `/actions/${action.id}/edit`
                                    )
                                  }
                                  onDelete={() =>
                                    setDeleteTarget(
                                      action
                                    )
                                  }
                                  onRestore={() =>
                                    setRestoreTarget(
                                      action
                                    )
                                  }
                                />

                              </TableCell>
                            )}

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
          <div className="space-y-3">

            {actions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No actions found.
                </CardContent>
              </Card>
            ) : (
              actions.map(
                (action) => (
                  <Card key={action.id}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                        {getInitials(
                          action.name
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-medium">
                            {action.name}
                          </h3>

                          <code className="rounded bg-muted px-2 py-0.5 text-xs">
                            {
                              action.actionCode
                            }
                          </code>

                        </div>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {
                            action.description ||
                            "No description"
                          }
                        </p>

                      </div>

                      <StatusBadge
                        active={
                          action.active
                        }
                        deleted={
                          action.deleted
                        }
                      />

                      <ActionMenu
                        action={action}
                        onView={() =>
                          navigate(
                            `/actions/${action.id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/actions/${action.id}/edit`
                          )
                        }
                        onDelete={() =>
                          setDeleteTarget(
                            action
                          )
                        }
                        onRestore={() =>
                          setRestoreTarget(
                            action
                          )
                        }
                      />

                    </CardContent>
                  </Card>
                )
              )
            )}

          </div>
        )}

        {/* CARD VIEW */}

        {viewMode === "card" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {actions.map(
              (action) => (
                <Card key={action.id}>

                  <CardContent className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {getInitials(
                            action.name
                          )}
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate font-semibold">
                            {
                              action.name
                            }
                          </h3>

                          <code className="text-xs text-muted-foreground">
                            {
                              action.actionCode
                            }
                          </code>

                        </div>

                      </div>

                      <ActionMenu
                        action={action}
                        onView={() =>
                          navigate(
                            `/actions/${action.id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/actions/${action.id}/edit`
                          )
                        }
                        onDelete={() =>
                          setDeleteTarget(
                            action
                          )
                        }
                        onRestore={() =>
                          setRestoreTarget(
                            action
                          )
                        }
                      />

                    </div>

                    <p className="mt-4 min-h-10 text-sm text-muted-foreground">
                      {
                        action.description ||
                        "No description provided."
                      }
                    </p>

                    <div className="mt-4">
                      <StatusBadge
                        active={
                          action.active
                        }
                        deleted={
                          action.deleted
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
            actions
          </p>

          <div className="flex items-center gap-2">

            <Select
              value={String(
                pageSize
              )}
              onValueChange={(value) => {
                setPageSize(
                  Number(value)
                );
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[100px]">
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

            <Button
              variant="outline"
              size="icon"
              disabled={
                page === 0
              }
              onClick={() =>
                setPage(
                  (prev) =>
                    Math.max(
                      0,
                      prev - 1
                    )
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="min-w-[70px] text-center text-sm">
              Page{" "}
              {totalPages === 0
                ? 0
                : page + 1}{" "}
              of{" "}
              {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={
                page + 1 >=
                totalPages
              }
              onClick={() =>
                setPage(
                  (prev) =>
                    prev + 1
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

          </div>

        </div>

      </div>

      {/* DELETE DIALOG */}

      <AlertDialog
        open={
          !!deleteTarget
        }
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(
              null
            );
          }
        }}
      >
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Delete Action?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action can be restored later.
            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={
                actionLoading
              }
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={
                handleDelete
              }
              disabled={
                actionLoading
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

      {/* RESTORE DIALOG */}

      <AlertDialog
        open={
          !!restoreTarget
        }
        onOpenChange={(open) => {
          if (!open) {
            setRestoreTarget(
              null
            );
          }
        }}
      >
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Restore Action?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to restore{" "}
              <span className="font-medium text-foreground">
                {restoreTarget?.name}
              </span>
              ?
            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={
                actionLoading
              }
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={
                handleRestore
              }
              disabled={
                actionLoading
              }
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Restore
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ActionsPage;