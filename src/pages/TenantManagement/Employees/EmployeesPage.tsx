import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  Grid2X2,
  List,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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

interface Employee {
  id: string;
  organizationId?: string | null;
  departmentId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  designation?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Organization {
  id: string;
  orgName?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Department {
  id: string;
  organizationId: string;
  departmentName: string;
  departmentCode: string;
  active: boolean;
  deleted: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
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
  employee: boolean;
  code: boolean;
  organization: boolean;
  department: boolean;
  designation: boolean;
  contact: boolean;
  status: boolean;
  created: boolean;
}


/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_COLUMNS: VisibleColumns = {
  employee: true,
  code: true,
  organization: true,
  department: true,
  designation: true,
  contact: true,
  status: true,
  created: true,
};

const PAGE_SIZE_OPTIONS = [
  10,
  20,
  50,
  100,
];


/* ============================================================
   API HELPERS
============================================================ */

async function fetchEmployees(): Promise<Employee[]> {
  const response =
    await api.get("/api/v1/employees");

  const data =
    response.data?.data ??
    response.data;

  return Array.isArray(data)
    ? data
    : data?.content ?? [];
}


async function fetchOrganizations(): Promise<Organization[]> {
  const response =
    await api.get(
      "/api/v1/organizations?size=100"
    );

  const data =
    response.data?.data ??
    response.data;

  return (
    data?.content ??
    data ??
    []
  );
}


async function fetchDepartments(
  organizationId?: string
): Promise<Department[]> {
  const params = new URLSearchParams();

  params.set("size", "100");

  if (organizationId) {
    params.set(
      "organizationId",
      organizationId
    );
  }

  const response =
    await api.get(
      `/api/v1/departments?${params.toString()}`
    );

  const data =
    response.data?.data ??
    response.data;

  return (
    data?.content ??
    data ??
    []
  );
}


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
}


function getInitials(
  firstName?: string,
  lastName?: string | null
): string {
  const first =
    firstName
      ?.trim()
      .charAt(0)
      .toUpperCase() ?? "";

  const last =
    lastName
      ?.trim()
      .charAt(0)
      .toUpperCase() ?? "";

  return (
    `${first}${last}` ||
    "EM"
  );
}


function getFullName(
  employee: Employee
): string {
  return [
    employee.firstName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}


function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <Badge
        variant="outline"
        className="
          border-green-500/30
          bg-green-500/5
          text-green-600
        "
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="
        border-orange-500/30
        bg-orange-500/5
        text-orange-600
      "
    >
      Inactive
    </Badge>
  );
}


/* ============================================================
   ACTION MENU
============================================================ */

interface EmployeeActionsProps {
  employee: Employee;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EmployeeActions({
  employee,
  onView,
  onEdit,
  onDelete,
}: EmployeeActionsProps) {
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

        {employee.active && (
          <DropdownMenuItem
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {employee.active && (
          <DropdownMenuItem
            onClick={onDelete}
            className="
              text-destructive
              focus:text-destructive
            "
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

export default function EmployeesPage() {
  const navigate =
    useNavigate();

  const queryClient =
    useQueryClient();

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    organizationFilter,
    setOrganizationFilter,
  ] = useState("");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ACTIVE");

  const [
    page,
    setPage,
  ] = useState(0);

  const [
    pageSize,
    setPageSize,
  ] = useState(20);

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
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  /* ==========================================================
     LOAD SAVED VIEW
  ========================================================== */

  useEffect(() => {
    const savedView =
      localStorage.getItem(
        "employees-view"
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
        "employees-density"
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
      "employees-view",
      viewMode
    );
  }, [viewMode]);


  useEffect(() => {
    localStorage.setItem(
      "employees-density",
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
      "employee-selector",
    ],
    queryFn:
      fetchOrganizations,
    staleTime: 60_000,
  });


  /* ==========================================================
     DEPARTMENTS
  ========================================================== */

  const {
    data: departments = [],
    isLoading:
      departmentsLoading,
  } = useQuery({
    queryKey: [
      "departments",
      "employee-selector",
      organizationFilter,
    ],
    queryFn: () =>
      fetchDepartments(
        organizationFilter ||
          undefined
      ),
    staleTime: 60_000,
  });


  /* ==========================================================
     EMPLOYEES
  ========================================================== */

  const {
    data: employees = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "employees",
    ],
    queryFn:
      fetchEmployees,
  });


  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredEmployees =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return employees.filter(
        (employee) => {
          const fullName =
            getFullName(
              employee
            );

          const matchesSearch =
            !normalizedSearch ||
            fullName
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            employee.employeeCode
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            employee.email
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            (
              employee.designation ??
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesOrganization =
            !organizationFilter ||
            employee.organizationId ===
              organizationFilter;

          const matchesDepartment =
            !departmentFilter ||
            employee.departmentId ===
              departmentFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            (
              statusFilter ===
                "ACTIVE" &&
              employee.active
            ) ||
            (
              statusFilter ===
                "INACTIVE" &&
              !employee.active
            );

          return (
            matchesSearch &&
            matchesOrganization &&
            matchesDepartment &&
            matchesStatus
          );
        }
      );
    }, [
      employees,
      search,
      organizationFilter,
      departmentFilter,
      statusFilter,
    ]);


  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalElements =
    filteredEmployees.length;

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

  const paginatedEmployees =
    filteredEmployees.slice(
      safePage * pageSize,
      safePage * pageSize +
        pageSize
    );


  useEffect(() => {
    if (page >= totalPages) {
      setPage(
        Math.max(
          0,
          totalPages - 1
        )
      );
    }
  }, [
    page,
    totalPages,
  ]);


  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearch =
    () => {
      setSearch(
        searchInput.trim()
      );
      setPage(0);
    };


  const clearSearch =
    () => {
      setSearchInput("");
      setSearch("");
      setPage(0);
    };


  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (
      employee: Employee
    ) => {
      const confirmed =
        window.confirm(
          `Delete employee "${getFullName(
            employee
          )}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionError("");

        await api.delete(
          `/api/v1/employees/${employee.id}`
        );

        await queryClient.invalidateQueries({
          queryKey: [
            "employees",
          ],
        });
      } catch (error: any) {
        setActionError(
          error?.response
            ?.data
            ?.message ??
            error?.response
              ?.data
              ?.error ??
            "Failed to delete employee."
        );
      }
    };


  /* ==========================================================
     ORGANIZATION NAME
  ========================================================== */

  const getOrganizationName =
    (
      organizationId?: string | null
    ) => {
      if (!organizationId) {
        return "-";
      }

      return (
        organizations.find(
          (item) =>
            item.id ===
            organizationId
        )?.orgName ??
        "-"
      );
    };


  const getDepartmentName =
    (
      departmentId?: string | null
    ) => {
      if (!departmentId) {
        return "-";
      }

      return (
        departments.find(
          (item) =>
            item.id ===
            departmentId
        )?.departmentName ??
        "-"
      );
    };


  const rowPadding =
    density === "compact"
      ? "py-2"
      : density === "comfortable"
      ? "py-5"
      : "py-3";


  /* ==========================================================
     ACTIVE FILTERS
  ========================================================== */

  const activeFilters =
    useMemo(() => {
      const result: string[] = [];

      if (search) {
        result.push(
          `Search: ${search}`
        );
      }

      if (organizationFilter) {
        result.push(
          `Organization: ${getOrganizationName(
            organizationFilter
          )}`
        );
      }

      if (departmentFilter) {
        result.push(
          `Department: ${getDepartmentName(
            departmentFilter
          )}`
        );
      }

      if (
        statusFilter !== "ACTIVE"
      ) {
        result.push(
          `Status: ${statusFilter}`
        );
      }

      return result;
    }, [
      search,
      organizationFilter,
      departmentFilter,
      statusFilter,
      organizations,
      departments,
    ]);


  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading employees...
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
              Failed to load employees
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error)
                ?.message ??
                "Unable to load employees."}
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


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full min-w-0 p-4 sm:p-6">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Employees
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage employees across your organizations.
            </p>
          </div>

          <Button
            onClick={() =>
              navigate(
                "/employees/add"
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>


        {/* ERROR */}

        {actionError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}


        {/* TOOLBAR */}

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 xl:flex-row">

              {/* SEARCH */}

              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={
                      searchInput
                    }
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
                    placeholder="
                      Search by name, code, email or designation...
                    "
                    className="pl-9"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={
                        clearSearch
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                  Search
                </Button>
              </div>


              {/* VIEW */}

              <div className="flex gap-2">
                <Button
                  variant={
                    viewMode ===
                    "table"
                      ? "secondary"
                      : "outline"
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
                      : "outline"
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
                      : "outline"
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

                <Button
                  variant="outline"
                  onClick={() =>
                    setFilterOpen(
                      true
                    )
                  }
                >
                  <Columns3 className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>


            {/* ACTIVE FILTERS */}

            {activeFilters.length >
              0 && (
              <div className="mt-3 flex flex-wrap gap-2">
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
              </div>
            )}
          </CardContent>
        </Card>


        {/* TABLE */}

        {viewMode ===
          "table" && (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.employee && (
                      <TableHead>
                        Employee
                      </TableHead>
                    )}

                    {visibleColumns.code && (
                      <TableHead>
                        Code
                      </TableHead>
                    )}

                    {visibleColumns.organization && (
                      <TableHead>
                        Organization
                      </TableHead>
                    )}

                    {visibleColumns.department && (
                      <TableHead>
                        Department
                      </TableHead>
                    )}

                    {visibleColumns.designation && (
                      <TableHead>
                        Designation
                      </TableHead>
                    )}

                    {visibleColumns.contact && (
                      <TableHead>
                        Contact
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

                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedEmployees.length ===
                    0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No employees found.
                      </TableCell>
                    </TableRow>
                  )}

                  {paginatedEmployees.map(
                    (employee) => (
                      <TableRow
                        key={
                          employee.id
                        }
                      >
                        {visibleColumns.employee && (
                          <TableCell
                            className={
                              rowPadding
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                {getInitials(
                                  employee.firstName,
                                  employee.lastName
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {getFullName(
                                    employee
                                  )}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  {
                                    employee.email
                                  }
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        )}

                        {visibleColumns.code && (
                          <TableCell
                            className={
                              rowPadding
                            }
                          >
                            <span className="font-mono text-xs">
                              {
                                employee.employeeCode
                              }
                            </span>
                          </TableCell>
                        )}

                        {visibleColumns.organization && (
                          <TableCell
                            className={
                              rowPadding
                            }
                          >
                            {
                              getOrganizationName(
                                employee.organizationId
                              )
                            }
                          </TableCell>
                        )}

                        {visibleColumns.department && (
                          <TableCell
                            className={
                              rowPadding
                            }
                          >
                            {
                              getDepartmentName(
                                employee.departmentId
                              )
                            }
                          </TableCell>
                        )}

                        {visibleColumns.designation && (
                          <TableCell
                            className={
                              rowPadding
                            }
                          >
                            {
                              employee.designation ??
                              "-"
                            }
                          </TableCell>
                        )}

                        {visibleColumns.contact && (
                          <TableCell
                            className={
                              rowPadding
                            }
                          >
                            <div>
                              <p className="text-sm">
                                {
                                  employee.email
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  employee.phoneNumber ??
                                  "-"
                                }
                              </p>
                            </div>
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
                                employee.active
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
                              employee.createdAt
                            )}
                          </TableCell>
                        )}

                        <TableCell className="text-right">
                          <EmployeeActions
                            employee={
                              employee
                            }
                            onView={() =>
                              navigate(
                                `/employees/${employee.id}`
                              )
                            }
                            onEdit={() =>
                              navigate(
                                `/employees/${employee.id}/edit`
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                employee
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
            {paginatedEmployees.map(
              (employee) => (
                <Card
                  key={
                    employee.id
                  }
                  className="p-0"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {getInitials(
                            employee.firstName,
                            employee.lastName
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {getFullName(
                              employee
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              employee.employeeCode
                            }
                          </p>
                        </div>
                      </div>

                      <span className="text-sm text-muted-foreground">
                        {
                          employee.designation ??
                          "-"
                        }
                      </span>

                      <span className="text-sm text-muted-foreground">
                        {
                          getDepartmentName(
                            employee.departmentId
                          )
                        }
                      </span>

                      <StatusBadge
                        active={
                          employee.active
                        }
                      />

                      <EmployeeActions
                        employee={
                          employee
                        }
                        onView={() =>
                          navigate(
                            `/employees/${employee.id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/employees/${employee.id}/edit`
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            employee
                          )
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {paginatedEmployees.length ===
              0 && (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No employees found.
                </CardContent>
              </Card>
            )}
          </div>
        )}


        {/* CARD */}

        {viewMode ===
          "card" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedEmployees.map(
              (employee) => (
                <Card
                  key={
                    employee.id
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {getInitials(
                            employee.firstName,
                            employee.lastName
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {getFullName(
                              employee
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              employee.employeeCode
                            }
                          </p>
                        </div>
                      </div>

                      <EmployeeActions
                        employee={
                          employee
                        }
                        onView={() =>
                          navigate(
                            `/employees/${employee.id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/employees/${employee.id}/edit`
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            employee
                          )
                        }
                      />
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Organization
                        </span>

                        <p className="font-medium">
                          {
                            getOrganizationName(
                              employee.organizationId
                            )
                          }
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Department
                        </span>

                        <p className="font-medium">
                          {
                            getDepartmentName(
                              employee.departmentId
                            )
                          }
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Designation
                        </span>

                        <p className="font-medium">
                          {
                            employee.designation ??
                            "-"
                          }
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />

                        <span className="truncate">
                          {
                            employee.email
                          }
                        </span>
                      </div>

                      <StatusBadge
                        active={
                          employee.active
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {paginatedEmployees.length ===
              0 && (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No employees found.
                </CardContent>
              </Card>
            )}
          </div>
        )}


        {/* PAGINATION */}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {totalElements === 0
              ? 0
              : safePage *
                  pageSize +
                1}{" "}
            to{" "}
            {Math.min(
              (safePage + 1) *
                pageSize,
              totalElements
            )}{" "}
            of{" "}
            {totalElements}{" "}
            employees
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
                  Number(value)
                );
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(
                  (size) => (
                    <SelectItem
                      key={size}
                      value={String(
                        size
                      )}
                    >
                      {size}
                    </SelectItem>
                  )
                )}
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
                  (current) =>
                    Math.max(
                      0,
                      current - 1
                    )
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="min-w-[80px] text-center text-sm">
              Page{" "}
              {safePage + 1}{" "}
              of{" "}
              {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={
                safePage >=
                totalPages - 1
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages - 1,
                      current + 1
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              Employee Filters
            </SheetTitle>

            <SheetDescription>
              Filter employees by organization, department and status.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 py-6">

            {/* ORGANIZATION */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Organization
              </label>

              <Select
                value={
                  organizationFilter ||
                  "ALL"
                }
                onValueChange={(
                  value
                ) => {
                  setOrganizationFilter(
                    value === "ALL"
                      ? ""
                      : value
                  );

                  setDepartmentFilter(
                    ""
                  );

                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All organizations" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All organizations
                  </SelectItem>

                  {organizations
                    .filter(
                      (organization) =>
                        organization.deleted !==
                          true &&
                        organization.active !==
                          false
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
                          {
                            organization.orgName
                          }
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>
            </div>


            {/* DEPARTMENT */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Department
              </label>

              <Select
                value={
                  departmentFilter ||
                  "ALL"
                }
                disabled={
                  departmentsLoading
                }
                onValueChange={(
                  value
                ) => {
                  setDepartmentFilter(
                    value === "ALL"
                      ? ""
                      : value
                  );

                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All departments
                  </SelectItem>

                  {departments
                    .filter(
                      (department) =>
                        department.deleted !==
                          true &&
                        department.active !==
                          false
                    )
                    .map(
                      (
                        department
                      ) => (
                        <SelectItem
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.departmentName
                          }
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
                  statusFilter
                }
                onValueChange={(
                  value
                ) => {
                  setStatusFilter(
                    value as
                      | "ALL"
                      | "ACTIVE"
                      | "INACTIVE"
                  );

                  setPage(0);
                }}
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


            {/* DENSITY */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Table Density
              </label>

              <Select
                value={
                  density
                }
                onValueChange={(
                  value
                ) =>
                  setDensity(
                    value as Density
                  )
                }
              >
                <SelectTrigger>
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


            {/* COLUMNS */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Columns
              </label>

              <div className="rounded-lg border">
                {(
                  Object.keys(
                    visibleColumns
                  ) as Array<
                    keyof VisibleColumns
                  >
                ).map(
                  (key) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={
                        visibleColumns[
                          key
                        ]
                      }
                      onCheckedChange={(
                        checked
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
                        .charAt(0)
                        .toUpperCase() +
                        key
                          .slice(
                            1
                          )}
                    </DropdownMenuCheckboxItem>
                  )
                )}
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOrganizationFilter(
                  ""
                );
                setDepartmentFilter(
                  ""
                );
                setStatusFilter(
                  "ACTIVE"
                );
                setSearchInput(
                  ""
                );
                setSearch("");
                setPage(0);
              }}
            >
              Reset
            </Button>

            <Button
              onClick={() =>
                setFilterOpen(
                  false
                )
              }
            >
              Apply
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}