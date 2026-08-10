import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

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

import {
  Badge,
} from "@/components/ui/badge";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

import {
  Separator,
} from "@/components/ui/separator";

/* ============================================================
   TYPES
============================================================ */

interface OrganizationContact {
  id?: string;

  firstName: string;

  lastName?: string | null;

  designation?: string | null;

  email: string;

  countryCode?: string | null;

  phoneNumber?: string | null;

  primary?: boolean;
}

interface Organization {
  id: string;

  orgName: string;

  orgLogo?: string | null;

  country?: string | null;

  state?: string | null;

  city?: string | null;

  addressLine1?: string | null;

  addressLine2?: string | null;

  postalCode?: string | null;

  website?: string | null;

  businessType?: string | null;

  active: boolean;

  deleted?: boolean;

  createdAt: string;

  updatedAt?: string | null;

  contact?: OrganizationContact | null;

  contactPerson?: OrganizationContact | null;
}

interface OrganizationPageResponse {
  content: Organization[];

  totalElements: number;

  totalPages: number;

  number: number;

  size: number;

  first: boolean;

  last: boolean;
}

interface OrganizationFilters {
  search: string;

  businessType: string;

  country: string;

  state: string;

  status: string;

  sortBy: string;

  sortDirection: string;
}

/* ============================================================
   CONSTANTS
============================================================ */

const BUSINESS_TYPES = [
  {
    value: "MANUFACTURER",
    label: "Manufacturer",
  },
  {
    value: "SUPPLIER",
    label: "Supplier",
  },
  {
    value: "DISTRIBUTOR",
    label: "Distributor",
  },
  {
    value: "RETAILER",
    label: "Retailer",
  },
  {
    value: "LOGISTICS",
    label: "Logistics",
  },
  {
    value: "RECYCLER",
    label: "Recycler",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function formatBusinessType(
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
      (character) =>
        character.toUpperCase()
    );
}

function formatDate(
  value?: string | null
): string {

  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

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
  name?: string | null
): string {

  if (!name) {
    return "OR";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

function getContact(
  organization: Organization
): OrganizationContact | null {

  return (
    organization.contact ??
    organization.contactPerson ??
    null
  );
}

/* ============================================================
   API
============================================================ */

async function fetchOrganizations(
  filters: OrganizationFilters,
  page: number,
  pageSize: number
): Promise<OrganizationPageResponse> {

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080";

  const params =
    new URLSearchParams();

  params.set(
    "page",
    String(page)
  );

  params.set(
    "size",
    String(pageSize)
  );

  if (
    filters.search.trim()
  ) {

    params.set(
      "search",
      filters.search.trim()
    );
  }

  if (
    filters.businessType
  ) {

    params.set(
      "businessType",
      filters.businessType
    );
  }

  if (
    filters.country.trim()
  ) {

    params.set(
      "country",
      filters.country.trim()
    );
  }

  if (
    filters.state.trim()
  ) {

    params.set(
      "state",
      filters.state.trim()
    );
  }

  if (
    filters.status &&
    filters.status !== "ALL"
  ) {

    params.set(
      "status",
      filters.status
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

  const token =
    localStorage.getItem(
      "accessToken"
    ) ??
    localStorage.getItem(
      "token"
    );

  const response =
    await fetch(
      `${baseUrl}/api/v1/organizations?${params.toString()}`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
      }
    );

  if (!response.ok) {

    let message =
      "Failed to load organizations.";

    try {

      const errorData =
        await response.json();

      message =
        errorData?.message ||
        errorData?.error ||
        message;

    } catch {
      // Ignore invalid JSON response
    }

    throw new Error(
      message
    );
  }

  return response.json();
}

/* ============================================================
   PAGE
============================================================ */

export default function OrganizationsPage() {

  const navigate =
    useNavigate();

  /* ==========================================================
     FILTER STATE
  ========================================================== */

  const [
    filters,
    setFilters,
  ] = useState<OrganizationFilters>({
    search: "",

    businessType: "",

    country: "",

    state: "",

    status: "ALL",

    sortBy: "createdAt",

    sortDirection: "DESC",
  });

  /* ==========================================================
     SEARCH INPUT
  ========================================================== */

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const [
    page,
    setPage,
  ] = useState(0);

  const [
    pageSize,
    setPageSize,
  ] = useState(20);

  /* ==========================================================
     TANSTACK QUERY
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
      "organizations",

      {
        page,

        pageSize,

        search:
          filters.search,

        businessType:
          filters.businessType,

        country:
          filters.country,

        state:
          filters.state,

        status:
          filters.status,

        sortBy:
          filters.sortBy,

        sortDirection:
          filters.sortDirection,
      },
    ],

    queryFn: () =>
      fetchOrganizations(
        filters,
        page,
        pageSize
      ),

    placeholderData:
      keepPreviousData,

    staleTime: 30_000,

  });

  /* ==========================================================
     DATA
  ========================================================== */

  const organizations =
    data?.content ?? [];

  const totalElements =
    data?.totalElements ?? 0;

  const totalPages =
    data?.totalPages ?? 0;

  /* ==========================================================
     ACTIVE FILTERS
  ========================================================== */

  const activeFilters =
    useMemo(() => {

      const result: {
        key: keyof OrganizationFilters;

        label: string;
      }[] = [];

      if (
        filters.search.trim()
      ) {

        result.push({
          key: "search",

          label:
            `Search: ${filters.search}`,
        });
      }

      if (
        filters.businessType
      ) {

        result.push({
          key:
            "businessType",

          label:
            formatBusinessType(
              filters.businessType
            ),
        });
      }

      if (
        filters.country.trim()
      ) {

        result.push({
          key: "country",

          label:
            `Country: ${filters.country}`,
        });
      }

      if (
        filters.state.trim()
      ) {

        result.push({
          key: "state",

          label:
            `State: ${filters.state}`,
        });
      }

      if (
        filters.status !==
        "ALL"
      ) {

        result.push({
          key: "status",

          label:
            filters.status ===
            "ACTIVE"
              ? "Active"
              : "Inactive",
        });
      }

      return result;

    }, [
      filters,
    ]);

  /* ==========================================================
     FILTER UPDATE
  ========================================================== */

  const updateFilter = <
    K extends keyof OrganizationFilters
  >(
    key: K,
    value: OrganizationFilters[K]
  ) => {

    setPage(0);

    setFilters(
      (current) => ({
        ...current,

        [key]: value,
      })
    );
  };

  /* ==========================================================
     SEARCH
  ========================================================== */

  const applySearch = () => {

    setPage(0);

    setFilters(
      (current) => ({
        ...current,

        search:
          searchInput.trim(),
      })
    );
  };

  /* ==========================================================
     SEARCH KEY
  ========================================================== */

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      applySearch();
    }
  };

  /* ==========================================================
     CLEAR ALL
  ========================================================== */

  const clearFilters = () => {

    setSearchInput("");

    setPage(0);

    setFilters({
      search: "",

      businessType: "",

      country: "",

      state: "",

      status: "ALL",

      sortBy: "createdAt",

      sortDirection: "DESC",
    });
  };

  /* ==========================================================
     REMOVE FILTER
  ========================================================== */

  const removeFilter = (
    key: keyof OrganizationFilters
  ) => {

    setPage(0);

    setFilters(
      (current) => ({
        ...current,

        [key]:
          key === "status"
            ? "ALL"
            : "",
      })
    );

    if (
      key === "search"
    ) {

      setSearchInput("");
    }
  };

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const firstItem =
    totalElements === 0
      ? 0
      : page *
          pageSize +
        1;

  const lastItem =
    Math.min(
      (page + 1) *
        pageSize,

      totalElements
    );

  const canPrevious =
    page > 0;

  const canNext =
    page <
    totalPages - 1;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <div className="w-full space-y-6 p-6 lg:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Organizations
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizations registered on the platform.
          </p>

        </div>

        <Button
          onClick={() =>
            navigate(
              "/organizations/new"
            )
          }
        >

          <Plus className="mr-2 h-4 w-4" />

          Add Organization

        </Button>

      </div>

      {/* ======================================================
          MAIN TABLE CARD
      ====================================================== */}

      <Card className="overflow-hidden space-y-0">

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              className="
                absolute
                left-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-muted-foreground
              "
            />

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
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search organizations..."
              className="h-9 pl-9 pr-9"
            />

            {searchInput && (

              <button
                type="button"
                onClick={() => {

                  setSearchInput("");

                  updateFilter(
                    "search",
                    ""
                  );
                }}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-muted-foreground
                  hover:text-foreground
                "
              >

                <X className="h-4 w-4" />

              </button>

            )}

          </div>

          {/* SEARCH */}

          <Button
            variant="secondary"
            size="sm"
            onClick={
              applySearch
            }
          >

            <Search className="mr-2 h-4 w-4" />

            Search

          </Button>

          {/* FILTER */}

          <Popover>

            <PopoverTrigger
              asChild
            >

              <Button
                variant="outline"
                size="sm"
              >

                <Filter className="mr-2 h-4 w-4" />

                Filters

                {activeFilters.length >
                  0 && (

                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 min-w-5 px-1.5"
                  >
                    {
                      activeFilters.length
                    }
                  </Badge>

                )}

              </Button>

            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-[360px] p-4"
            >

              <div className="space-y-5">

                {/* FILTER HEADER */}

                <div className="flex items-start justify-between">

                  <div>

                    <h3 className="font-medium">
                      Filters
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Refine your organization list.
                    </p>

                  </div>

                </div>

                <Separator />

                {/* BUSINESS TYPE */}

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Business Type
                  </label>

                  <Select
                    value={
                      filters.businessType ||
                      "ALL"
                    }
                    onValueChange={(
                      value
                    ) =>
                      updateFilter(
                        "businessType",
                        value ===
                          "ALL"
                          ? ""
                          : value
                      )
                    }
                  >

                    <SelectTrigger className="h-9">

                      <SelectValue />

                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="ALL">
                        All Business Types
                      </SelectItem>

                      {BUSINESS_TYPES.map(
                        (
                          businessType
                        ) => (

                          <SelectItem
                            key={
                              businessType.value
                            }
                            value={
                              businessType.value
                            }
                          >
                            {
                              businessType.label
                            }
                          </SelectItem>

                        )
                      )}

                    </SelectContent>

                  </Select>

                </div>

                {/* COUNTRY */}

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Country
                  </label>

                  <Input
                    value={
                      filters.country
                    }
                    onChange={(
                      event
                    ) =>
                      updateFilter(
                        "country",
                        event.target.value
                      )
                    }
                    placeholder="e.g. India"
                    className="h-9"
                  />

                </div>

                {/* STATE */}

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    State
                  </label>

                  <Input
                    value={
                      filters.state
                    }
                    onChange={(
                      event
                    ) =>
                      updateFilter(
                        "state",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Tamil Nadu"
                    className="h-9"
                  />

                </div>

                {/* STATUS */}

                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Status
                  </label>

                  <Select
                    value={
                      filters.status
                    }
                    onValueChange={(
                      value
                    ) =>
                      updateFilter(
                        "status",
                        value
                      )
                    }
                  >

                    <SelectTrigger className="h-9">

                      <SelectValue />

                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="ALL">
                        All Status
                      </SelectItem>

                      <SelectItem value="ACTIVE">
                        Active
                      </SelectItem>

                      <SelectItem value="INACTIVE">
                        Inactive
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                <Separator />

                {/* SORT */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="space-y-2">

                    <label className="text-sm font-medium">
                      Sort By
                    </label>

                    <Select
                      value={
                        filters.sortBy
                      }
                      onValueChange={(
                        value
                      ) =>
                        updateFilter(
                          "sortBy",
                          value
                        )
                      }
                    >

                      <SelectTrigger className="h-9">

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="createdAt">
                          Created
                        </SelectItem>

                        <SelectItem value="orgName">
                          Name
                        </SelectItem>

                        <SelectItem value="updatedAt">
                          Updated
                        </SelectItem>

                        <SelectItem value="country">
                          Country
                        </SelectItem>

                        <SelectItem value="businessType">
                          Business Type
                        </SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  <div className="space-y-2">

                    <label className="text-sm font-medium">
                      Order
                    </label>

                    <Select
                      value={
                        filters.sortDirection
                      }
                      onValueChange={(
                        value
                      ) =>
                        updateFilter(
                          "sortDirection",
                          value
                        )
                      }
                    >

                      <SelectTrigger className="h-9">

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="DESC">
                          Newest
                        </SelectItem>

                        <SelectItem value="ASC">
                          Oldest
                        </SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                </div>

                <Separator />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={
                    clearFilters
                  }
                >

                  Clear All Filters

                </Button>

              </div>

            </PopoverContent>

          </Popover>

          {/* REFRESH */}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={
              isFetching
            }
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

            <span className="sr-only">
              Refresh
            </span>

          </Button>

        </div>

        {/* ====================================================
            ACTIVE FILTER CHIPS
        ==================================================== */}

        {activeFilters.length >
          0 && (

          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">

            <span className="mr-1 text-xs text-muted-foreground">
              Applied:
            </span>

            {activeFilters.map(
              (filter) => (

                <Badge
                  key={
                    filter.key
                  }
                  variant="secondary"
                  className="gap-1 pr-1"
                >

                  {filter.label}

                  <button
                    type="button"
                    onClick={() =>
                      removeFilter(
                        filter.key
                      )
                    }
                    className="
                      ml-1
                      rounded-full
                      p-0.5
                      hover:bg-background
                    "
                    aria-label={`Remove ${filter.label}`}
                  >

                    <X className="h-3 w-3" />

                  </button>

                </Badge>

              )
            )}

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="ml-1 text-xs text-muted-foreground hover:text-foreground"
            >

              Clear all

            </button>

          </div>

        )}

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="relative overflow-x-auto">

          {/* FETCHING INDICATOR */}

          {isFetching &&
            !isLoading && (

              <div className="absolute right-4 top-4 z-10">

                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs shadow-sm">

                  <Loader2 className="h-3.5 w-3.5 animate-spin" />

                  Updating...

                </div>

              </div>

            )}

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead className="min-w-[260px]">
                  Organization
                </TableHead>

                <TableHead className="min-w-[150px]">
                  Business Type
                </TableHead>

                <TableHead className="min-w-[190px]">
                  Location
                </TableHead>

                <TableHead className="min-w-[200px]">
                  Contact
                </TableHead>

                <TableHead className="min-w-[100px]">
                  Status
                </TableHead>

                <TableHead className="min-w-[120px]">
                  Created
                </TableHead>

                <TableHead className="w-[60px]" />

              </TableRow>

            </TableHeader>

            <TableBody>

              {/* ==================================================
                  LOADING
              ================================================== */}

              {isLoading && (

                <TableRow>

                  <TableCell
                    colSpan={7}
                    className="h-64"
                  >

                    <div className="flex flex-col items-center justify-center gap-3">

                      <Loader2 className="h-7 w-7 animate-spin text-primary" />

                      <p className="text-sm text-muted-foreground">
                        Loading organizations...
                      </p>

                    </div>

                  </TableCell>

                </TableRow>

              )}

              {/* ==================================================
                  ERROR
              ================================================== */}

              {!isLoading &&
                isError && (

                  <TableRow>

                    <TableCell
                      colSpan={7}
                      className="h-64"
                    >

                      <div className="flex flex-col items-center justify-center text-center">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">

                          <X className="h-5 w-5 text-destructive" />

                        </div>

                        <p className="mt-3 font-medium">
                          Failed to load organizations
                        </p>

                        <p className="mt-1 max-w-md text-sm text-muted-foreground">

                          {error instanceof
                          Error
                            ? error.message
                            : "Something went wrong while loading organizations."}

                        </p>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() =>
                            refetch()
                          }
                        >

                          <RefreshCw className="mr-2 h-4 w-4" />

                          Try Again

                        </Button>

                      </div>

                    </TableCell>

                  </TableRow>

                )}

              {/* ==================================================
                  EMPTY
              ================================================== */}

              {!isLoading &&
                !isError &&
                organizations.length ===
                  0 && (

                  <TableRow>

                    <TableCell
                      colSpan={7}
                      className="h-64"
                    >

                      <div className="flex flex-col items-center justify-center text-center">

                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">

                          <Building2 className="h-6 w-6 text-muted-foreground" />

                        </div>

                        <p className="mt-4 font-medium">
                          No organizations found
                        </p>

                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">

                          No organizations match your current search or filters.

                        </p>

                        {activeFilters.length >
                          0 && (

                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={
                              clearFilters
                            }
                          >

                            Clear Filters

                          </Button>

                        )}

                      </div>

                    </TableCell>

                  </TableRow>

                )}

              {/* ==================================================
                  DATA
              ================================================== */}

              {!isLoading &&
                !isError &&
                organizations.map(
                  (
                    organization
                  ) => {

                    const contact =
                      getContact(
                        organization
                      );

                    return (

                      <TableRow
                        key={
                          organization.id
                        }
                        className="group"
                      >

                        {/* ========================================
                            ORGANIZATION
                        ======================================== */}

                        <TableCell>

                          <div className="flex items-center gap-3">

                            {organization.orgLogo ? (

                              <img
                                src={
                                  organization.orgLogo.startsWith(
                                    "data:"
                                  )
                                    ? organization.orgLogo
                                    : `data:image/png;base64,${organization.orgLogo}`
                                }
                                alt={
                                  organization.orgName
                                }
                                className="h-10 w-10 shrink-0 rounded-lg border object-cover"
                              />

                            ) : (

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-semibold">

                                {
                                  getInitials(
                                    organization.orgName
                                  )
                                }

                              </div>

                            )}

                            <div className="min-w-0">

                              <button
                                type="button"
                                className="max-w-[220px] truncate text-left text-sm font-medium hover:underline"
                                onClick={() =>
                                  navigate(
                                    `/organizations/${organization.id}`
                                  )
                                }
                              >

                                {
                                  organization.orgName
                                }

                              </button>

                              <p className="mt-0.5 truncate text-xs text-muted-foreground">

                                {
                                  organization.city ??
                                  "-"
                                }

                              </p>

                            </div>

                          </div>

                        </TableCell>

                        {/* ========================================
                            BUSINESS TYPE
                        ======================================== */}

                        <TableCell>

                          <Badge
                            variant="secondary"
                          >

                            {
                              formatBusinessType(
                                organization.businessType
                              )
                            }

                          </Badge>

                        </TableCell>

                        {/* ========================================
                            LOCATION
                        ======================================== */}

                        <TableCell>

                          <div>

                            <p className="text-sm">

                              {
                                organization.city ??
                                "-"
                              }

                              {organization.state
                                ? `, ${organization.state}`
                                : ""}

                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">

                              {
                                organization.country ??
                                "-"
                              }

                            </p>

                          </div>

                        </TableCell>

                        {/* ========================================
                            CONTACT
                        ======================================== */}

                        <TableCell>

                          {contact ? (

                            <div>

                              <p className="text-sm font-medium">

                                {
                                  contact.firstName
                                }

                                {contact.lastName
                                  ? ` ${contact.lastName}`
                                  : ""}

                              </p>

                              <p className="mt-0.5 max-w-[190px] truncate text-xs text-muted-foreground">

                                {
                                  contact.designation ??
                                  contact.email
                                }

                              </p>

                            </div>

                          ) : (

                            <span className="text-sm text-muted-foreground">
                              -
                            </span>

                          )}

                        </TableCell>

                        {/* ========================================
                            STATUS
                        ======================================== */}

                        <TableCell>

                          {organization.active &&
                          !organization.deleted ? (

                            <Badge
                              variant="outline"
                              className="
                                border-emerald-500/30
                                bg-emerald-500/10
                                text-emerald-700
                              "
                            >

                              Active

                            </Badge>

                          ) : (

                            <Badge
                              variant="outline"
                              className="
                                border-amber-500/30
                                bg-amber-500/10
                                text-amber-700
                              "
                            >

                              Inactive

                            </Badge>

                          )}

                        </TableCell>

                        {/* ========================================
                            CREATED
                        ======================================== */}

                        <TableCell>

                          <span className="whitespace-nowrap text-sm text-muted-foreground">

                            {
                              formatDate(
                                organization.createdAt
                              )
                            }

                          </span>

                        </TableCell>

                        {/* ========================================
                            ACTIONS
                        ======================================== */}

                        <TableCell>

                          <DropdownMenu>

                            <DropdownMenuTrigger
                              asChild
                            >

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >

                                <MoreHorizontal className="h-4 w-4" />

                                <span className="sr-only">
                                  Organization actions
                                </span>

                              </Button>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-44"
                            >

                              {/* VIEW */}

                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/organizations/${organization.id}`
                                  )
                                }
                              >

                                <Eye className="mr-2 h-4 w-4" />

                                View

                              </DropdownMenuItem>

                              {/* EDIT */}

                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/organizations/${organization.id}/edit`
                                  )
                                }
                              >

                                <Pencil className="mr-2 h-4 w-4" />

                                Edit

                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* DEACTIVATE */}

                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  /*
                                   * Connect your DELETE
                                   * mutation here.
                                   */
                                  console.log(
                                    "Deactivate organization:",
                                    organization.id
                                  );
                                }}
                              >

                                <Trash2 className="mr-2 h-4 w-4" />

                                Deactivate

                              </DropdownMenuItem>

                            </DropdownMenuContent>

                          </DropdownMenu>

                        </TableCell>

                      </TableRow>

                    );
                  }
                )}

            </TableBody>

          </Table>

        </div>

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!isLoading &&
          !isError &&
          totalElements > 0 && (

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

              {/* RESULTS */}

              <div className="text-sm text-muted-foreground">

                Showing{" "}

                <span className="font-medium text-foreground">
                  {firstItem}
                </span>

                {" "}–{" "}

                <span className="font-medium text-foreground">
                  {lastItem}
                </span>

                {" "}of{" "}

                <span className="font-medium text-foreground">
                  {totalElements}
                </span>

              </div>

              {/* PAGINATION */}

              <div className="flex items-center gap-2">

                {/* PAGE SIZE */}

                <Select
                  value={
                    String(pageSize)
                  }
                  onValueChange={(
                    value
                  ) => {

                    setPageSize(
                      Number(value)
                    );

                    setPage(0);

                  }}
                >

                  <SelectTrigger className="h-8 w-[100px]">

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

                {/* PREVIOUS */}

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={
                    !canPrevious ||
                    isFetching
                  }
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

                {/* PAGE */}

                <span className="min-w-[70px] text-center text-sm">

                  {page + 1}

                  {" / "}

                  {Math.max(
                    totalPages,
                    1
                  )}

                </span>

                {/* NEXT */}

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={
                    !canNext ||
                    isFetching
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                >

                  <ChevronRight className="h-4 w-4" />

                </Button>

              </div>

            </div>

          )}

      </Card>

    </div>
  );
}