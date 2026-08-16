
import { useEffect, useMemo, useState, type KeyboardEvent} from "react";

import { useNavigate } from "react-router-dom";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Eye,
  Filter,
  Grid2X2,
  List,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Table2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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

  active?: boolean;
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

  /*
   * IMPORTANT:
   *
   * Your backend returns contacts[].
   */
  contacts?: OrganizationContact[];
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

  city: string;

  contactName: string;

  contactEmail: string;

  status: string;

  sortBy: string;

  sortDirection: string;

  createdFrom: string;

  createdTo: string;
}


type ViewMode =
  | "table"
  | "list"
  | "card";


type Density =
  | "comfortable"
  | "standard"
  | "compact";


type ColumnKey =
  | "organization"
  | "businessType"
  | "location"
  | "contact"
  | "status"
  | "created"
  | "updated";


interface ColumnConfig {
  key: ColumnKey;
  label: string;
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


const COLUMNS: ColumnConfig[] = [
  {
    key: "organization",
    label: "Organization",
  },
  {
    key: "businessType",
    label: "Business Type",
  },
  {
    key: "location",
    label: "Location",
  },
  {
    key: "contact",
    label: "Contact",
  },
  {
    key: "status",
    label: "Status",
  },
  {
    key: "created",
    label: "Created",
  },
  {
    key: "updated",
    label: "Updated",
  },
];


const DEFAULT_FILTERS: OrganizationFilters = {
  search: "",

  businessType: "",

  country: "",

  state: "",

  city: "",

  contactName: "",

  contactEmail: "",

  status: "ALL",

  sortBy: "createdAt",

  sortDirection: "DESC",

  createdFrom: "",

  createdTo: "",
};


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
        word.charAt(0).toUpperCase()
    )
    .join("");
}


/*
 * IMPORTANT:
 *
 * Backend returns:
 *
 * contacts: [...]
 *
 * We choose the primary contact first.
 */
function getContact(
  organization: Organization
): OrganizationContact | null {

  return (
    organization.contacts?.find(
      (contact) =>
        contact.primary === true
    ) ??
    organization.contacts?.[0] ??
    null
  );
}


function getContactName(
  contact?: OrganizationContact | null
): string {

  if (!contact) {
    return "-";
  }

  return [
    contact.firstName,

    contact.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}


function getLogoUrl(
  logo?: string | null
): string | null {

  if (!logo) {
    return null;
  }

  if (
    logo.startsWith("data:")
  ) {
    return logo;
  }

  return `data:image/png;base64,${logo}`;
}


function normalizeDateForApi(
  value: string
): string {

  if (!value) {
    return "";
  }

  return value;
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


  const params = new URLSearchParams();

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


  /*
   * These parameters are included only if
   * your backend supports them.
   *
   * If unsupported, remove these five blocks.
   */

  if (
    filters.city.trim()
  ) {

    params.set(
      "city",
      filters.city.trim()
    );

  }


  if (
    filters.contactName.trim()
  ) {

    params.set(
      "contactName",
      filters.contactName.trim()
    );

  }


  if (
    filters.contactEmail.trim()
  ) {

    params.set(
      "contactEmail",
      filters.contactEmail.trim()
    );

  }


  if (
    filters.createdFrom
  ) {

    params.set(
      "createdFrom",
      normalizeDateForApi(
        filters.createdFrom
      )
    );

  }


  if (
    filters.createdTo
  ) {

    params.set(
      "createdTo",
      normalizeDateForApi(
        filters.createdTo
      )
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
      // Ignore invalid JSON
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
     SEARCH
  ========================================================== */

  const [
    searchInput,
    setSearchInput,
  ] = useState("");


  /* ==========================================================
     FILTERS
  ========================================================== */

  const [
    filters,
    setFilters,
  ] = useState<OrganizationFilters>(
    DEFAULT_FILTERS
  );


  /*
   * Temporary filter state.
   *
   * Advanced filters modify this.
   * API is called only after Apply.
   */

  const [
    draftFilters,
    setDraftFilters,
  ] = useState<OrganizationFilters>(
    DEFAULT_FILTERS
  );


  const [
    advancedFilterOpen,
    setAdvancedFilterOpen,
  ] = useState(false);


  /* ==========================================================
     VIEW
  ========================================================== */

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>(() => {

    const saved =
      localStorage.getItem(
        "organizations-view"
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


  /* ==========================================================
     DENSITY
  ========================================================== */

  const [
    density,
    setDensity,
  ] = useState<Density>(() => {

    const saved =
      localStorage.getItem(
        "organizations-density"
      );

    if (
      saved === "comfortable" ||
      saved === "standard" ||
      saved === "compact"
    ) {

      return saved;

    }

    return "standard";

  });


  /* ==========================================================
     COLUMNS
  ========================================================== */

  const [
    visibleColumns,
    setVisibleColumns,
  ] = useState<
    Record<ColumnKey, boolean>
  >({

    organization: true,

    businessType: true,

    location: true,

    contact: true,

    status: true,

    created: true,

    updated: false,

  });


  /* ==========================================================
     SELECTED ROWS
  ========================================================== */

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<
    Set<string>
  >(new Set());


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
     QUERY
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

        city:
          filters.city,

        contactName:
          filters.contactName,

        contactEmail:
          filters.contactEmail,

        status:
          filters.status,

        sortBy:
          filters.sortBy,

        sortDirection:
          filters.sortDirection,

        createdFrom:
          filters.createdFrom,

        createdTo:
          filters.createdTo,
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

    staleTime:
      30_000,

  });


  /* ==========================================================
     PERSIST VIEW SETTINGS
  ========================================================== */

  useEffect(() => {

    localStorage.setItem(
      "organizations-view",
      viewMode
    );

  }, [viewMode]);


  useEffect(() => {

    localStorage.setItem(
      "organizations-density",
      density
    );

  }, [density]);


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
        filters.city.trim()
      ) {

        result.push({
          key: "city",

          label:
            `City: ${filters.city}`,
        });

      }


      if (
        filters.contactName.trim()
      ) {

        result.push({
          key:
            "contactName",

          label:
            `Contact: ${filters.contactName}`,
        });

      }


      if (
        filters.contactEmail.trim()
      ) {

        result.push({
          key:
            "contactEmail",

          label:
            `Email: ${filters.contactEmail}`,
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


      if (
        filters.createdFrom
      ) {

        result.push({
          key:
            "createdFrom",

          label:
            `Created from: ${formatDate(
              filters.createdFrom
            )}`,
        });

      }


      if (
        filters.createdTo
      ) {

        result.push({
          key:
            "createdTo",

          label:
            `Created to: ${formatDate(
              filters.createdTo
            )}`,
        });

      }


      return result;

    }, [
      filters,
    ]);


  /* ==========================================================
     UPDATE FILTER
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


  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      applySearch();

    }

  };


  /* ==========================================================
     ADVANCED FILTERS
  ========================================================== */

  const openAdvancedFilters =
    () => {

      setDraftFilters(
        filters
      );

      setAdvancedFilterOpen(
        true
      );

    };


  const applyAdvancedFilters =
    () => {

      setPage(0);

      setFilters(
        draftFilters
      );

      setSearchInput(
        draftFilters.search
      );

      setAdvancedFilterOpen(
        false
      );

    };


  const resetDraftFilters =
    () => {

      setDraftFilters(
        DEFAULT_FILTERS
      );

    };


  /* ==========================================================
     CLEAR ALL FILTERS
  ========================================================== */

  const clearFilters = () => {

    setSearchInput("");

    setPage(0);

    setFilters(
      DEFAULT_FILTERS
    );

    setDraftFilters(
      DEFAULT_FILTERS
    );

  };


  /* ==========================================================
     REMOVE ONE FILTER
  ========================================================== */

  const removeFilter = (
    key: keyof OrganizationFilters
  ) => {

    const nextFilters = {
      ...filters,

      [key]:
        key === "status"
          ? "ALL"
          : "",
    };


    setPage(0);

    setFilters(
      nextFilters
    );


    setDraftFilters(
      nextFilters
    );


    if (
      key === "search"
    ) {

      setSearchInput("");

    }

  };


  /* ==========================================================
     STATUS
  ========================================================== */

  const setStatus = (
    status: string
  ) => {

    setPage(0);

    setFilters(
      (current) => ({
        ...current,

        status,
      })
    );


    setDraftFilters(
      (current) => ({
        ...current,

        status,
      })
    );

  };


  /* ==========================================================
     SORT
  ========================================================== */

  const changeSort = (
    sortBy: string
  ) => {

    setPage(0);

    setFilters(
      (current) => {

        if (
          current.sortBy ===
          sortBy
        ) {

          return {
            ...current,

            sortDirection:
              current.sortDirection ===
              "ASC"
                ? "DESC"
                : "ASC",
          };

        }


        return {
          ...current,

          sortBy,

          sortDirection:
            "ASC",
        };

      }
    );

  };


  /* ==========================================================
     SELECTION
  ========================================================== */

  const allVisibleSelected =
    organizations.length > 0 &&
    organizations.every(
      (organization) =>
        selectedIds.has(
          organization.id
        )
    );


  const toggleSelectAll =
    () => {

      setSelectedIds(
        (current) => {

          const next =
            new Set(current);


          if (
            allVisibleSelected
          ) {

            organizations.forEach(
              (organization) =>
                next.delete(
                  organization.id
                )
            );

          } else {

            organizations.forEach(
              (organization) =>
                next.add(
                  organization.id
                )
            );

          }


          return next;

        }
      );

    };


  const toggleSelected = (
    id: string
  ) => {

    setSelectedIds(
      (current) => {

        const next =
          new Set(current);


        if (
          next.has(id)
        ) {

          next.delete(id);

        } else {

          next.add(id);

        }


        return next;

      }
    );

  };


  const clearSelection = () => {

    setSelectedIds(
      new Set()
    );

  };


  /* ==========================================================
     COLUMNS
  ========================================================== */

  const toggleColumn = (
    key: ColumnKey
  ) => {

    setVisibleColumns(
      (current) => ({
        ...current,

        [key]:
          !current[key],
      })
    );

  };


  const visibleColumnCount =
    Object.values(
      visibleColumns
    ).filter(Boolean).length;


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
     TABLE DENSITY
  ========================================================== */

  const tableCellClass =
    density === "comfortable"
      ? "py-5"
      : density === "compact"
        ? "py-2"
        : "py-3";


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <div className="w-full space-y-5 p-6 lg:p-8">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <Building2
              className="
                h-6
                w-6
                text-primary
              "
            />

            <h1
              className="
                text-2xl
                font-semibold
                tracking-tight
              "
            >

              Organizations

            </h1>

          </div>


          <p
            className="
              mt-1
              text-sm
              text-muted-foreground
            "
          >

            Manage organizations registered
            on the platform.

          </p>

        </div>


        <Button
          onClick={() =>
            navigate(
              "/organizations/new"
            )
          }
        >

          <Plus
            className="
              mr-2
              h-4
              w-4
            "
          />

          Add Organization

        </Button>

      </div>


      {/* ======================================================
          MAIN WORKSPACE
      ====================================================== */}

      <Card
        className="
          overflow-hidden
          border
          shadow-sm
        "
      >

        {/* ====================================================
            TOP TOOLBAR
        ==================================================== */}

        <div
          className="
            border-b
            bg-background
            p-4
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              xl:flex-row
              xl:items-center
              xl:justify-between
            "
          >

            {/* SEARCH */}

            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                gap-2
              "
            >

              <div
                className="
                  relative
                  w-full
                  max-w-xl
                "
              >

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
                  placeholder="
                    Search organizations,
                    ID, contact or email...
                  "
                  className="
                    h-10
                    pl-9
                    pr-10
                  "
                />


                {searchInput && (

                  <button
                    type="button"
                    onClick={() => {

                      setSearchInput(
                        ""
                      );

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

                    <X
                      className="
                        h-4
                        w-4
                      "
                    />

                  </button>

                )}

              </div>


              <Button
                type="button"
                variant="secondary"
                className="h-10 shrink-0"
                onClick={
                  applySearch
                }
              >

                Search

              </Button>

            </div>


            {/* RIGHT CONTROLS */}

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >

              {/* STATUS */}

              <div
                className="
                  flex
                  h-10
                  items-center
                  rounded-md
                  border
                  bg-muted/30
                  p-1
                "
              >

                {[
                  {
                    value: "ALL",
                    label: "All",
                  },
                  {
                    value: "ACTIVE",
                    label: "Active",
                  },
                  {
                    value: "INACTIVE",
                    label: "Inactive",
                  },
                ].map(
                  (item) => (

                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        setStatus(
                          item.value
                        )
                      }
                      className={`
                        h-8
                        rounded
                        px-3
                        text-xs
                        font-medium
                        transition-colors
                        ${
                          filters.status ===
                          item.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      `}
                    >

                      {item.label}

                    </button>

                  )
                )}

              </div>


              {/* ADVANCED FILTER */}

              <Button
                type="button"
                variant={
                  activeFilters.length >
                  0
                    ? "secondary"
                    : "outline"
                }
                className="h-10"
                onClick={
                  openAdvancedFilters
                }
              >

                <SlidersHorizontal
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                Advanced Filters

                {activeFilters.length >
                  0 && (

                  <Badge
                    variant="default"
                    className="
                      ml-2
                      h-5
                      min-w-5
                      justify-center
                      rounded-full
                      px-1.5
                      text-[10px]
                    "
                  >

                    {
                      activeFilters.length
                    }

                  </Badge>

                )}

              </Button>


              {/* REFRESH */}

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="
                  h-10
                  w-10
                "
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


              {/* MORE */}

              <DropdownMenu>

                <DropdownMenuTrigger
                  asChild
                >

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="
                      h-10
                      w-10
                    "
                  >

                    <MoreHorizontal
                      className="
                        h-4
                        w-4
                      "
                    />

                  </Button>

                </DropdownMenuTrigger>


                <DropdownMenuContent
                  align="end"
                  className="w-48"
                >

                  <DropdownMenuItem>

                    <Download
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Export

                  </DropdownMenuItem>


                  <DropdownMenuItem>

                    <Archive
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Saved Views

                  </DropdownMenuItem>


                  <DropdownMenuSeparator />


                  <DropdownMenuItem
                    onClick={
                      clearFilters
                    }
                  >

                    <RotateCcw
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Reset Workspace

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

            </div>

          </div>


          {/* ==================================================
              APPLIED FILTERS
          ================================================== */}

          <div
            className="
              mt-3
              flex
              min-h-8
              flex-wrap
              items-center
              gap-2
            "
          >

            {activeFilters.length >
              0 ? (

              <>

                <span
                  className="
                    mr-1
                    text-xs
                    font-medium
                    text-muted-foreground
                  "
                >

                  Applied filters:

                </span>


                {activeFilters.map(
                  (filter) => (

                    <Badge
                      key={
                        filter.key
                      }
                      variant="secondary"
                      className="
                        gap-1
                        rounded-md
                        px-2
                        py-1
                        text-xs
                        font-normal
                      "
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

                        <X
                          className="
                            h-3
                            w-3
                          "
                        />

                      </button>

                    </Badge>

                  )
                )}


                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="
                    ml-1
                    text-xs
                    font-medium
                    text-muted-foreground
                    hover:text-foreground
                  "
                >

                  Clear all

                </button>

              </>

            ) : (

              <span
                className="
                  text-xs
                  text-muted-foreground
                "
              >

                No advanced filters applied

              </span>

            )}

          </div>

        </div>


        {/* ====================================================
            DATA WORKSPACE TOOLBAR
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            bg-muted/20
            px-4
            py-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          {/* RESULT COUNT */}

          <div>

            <p
              className="
                text-sm
                font-medium
              "
            >

              {totalElements.toLocaleString(
                "en-IN"
              )}{" "}

              organizations

            </p>


            {selectedIds.size >
              0 ? (

              <p
                className="
                  mt-0.5
                  text-xs
                  text-primary
                "
              >

                {
                  selectedIds.size
                }{" "}
                selected

              </p>

            ) : (

              <p
                className="
                  mt-0.5
                  text-xs
                  text-muted-foreground
                "
              >

                Showing the current
                filtered result set

              </p>

            )}

          </div>


          {/* VIEW CONTROLS */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >

            {/* COLUMNS */}

            {viewMode ===
              "table" && (

              <DropdownMenu>

                <DropdownMenuTrigger
                  asChild
                >

                  <Button
                    variant="outline"
                    size="sm"
                  >

                    <Columns3
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Columns

                    <ChevronDown
                      className="
                        ml-2
                        h-3.5
                        w-3.5
                      "
                    />

                  </Button>

                </DropdownMenuTrigger>


                <DropdownMenuContent
                  align="end"
                  className="w-52"
                >

                  <div
                    className="
                      px-2
                      py-1.5
                      text-xs
                      font-medium
                      text-muted-foreground
                    "
                  >

                    Show columns

                  </div>


                  <DropdownMenuSeparator />


                  {COLUMNS.map(
                    (column) => (

                      <DropdownMenuCheckboxItem
                        key={
                          column.key
                        }
                        checked={
                          visibleColumns[
                            column.key
                          ]
                        }
                        disabled={
                          column.key ===
                          "organization"
                        }
                        onCheckedChange={() =>
                          toggleColumn(
                            column.key
                          )
                        }
                      >

                        {
                          column.label
                        }

                      </DropdownMenuCheckboxItem>

                    )
                  )}

                </DropdownMenuContent>

              </DropdownMenu>

            )}


            {/* DENSITY */}

            {viewMode ===
              "table" && (

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

                <SelectTrigger
                  className="
                    h-9
                    w-[120px]
                  "
                >

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

            )}


            {/* VIEW SWITCHER */}

            <div
              className="
                flex
                h-9
                items-center
                rounded-md
                border
                bg-background
                p-1
              "
            >

              <ViewButton
                active={
                  viewMode ===
                  "table"
                }
                icon={
                  <Table2
                    className="
                      h-4
                      w-4
                    "
                  />
                }
                label="Table view"
                onClick={() =>
                  setViewMode(
                    "table"
                  )
                }
              />


              <ViewButton
                active={
                  viewMode ===
                  "list"
                }
                icon={
                  <List
                    className="
                      h-4
                      w-4
                    "
                  />
                }
                label="List view"
                onClick={() =>
                  setViewMode(
                    "list"
                  )
                }
              />


              <ViewButton
                active={
                  viewMode ===
                  "card"
                }
                icon={
                  <Grid2X2
                    className="
                      h-4
                      w-4
                    "
                  />
                }
                label="Card view"
                onClick={() =>
                  setViewMode(
                    "card"
                  )
                }
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            BULK ACTION BAR
        ==================================================== */}

        {selectedIds.size >
          0 && (

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
              border-b
              bg-primary/5
              px-4
              py-2.5
            "
          >

            <Badge
              variant="secondary"
              className="mr-2"
            >

              {
                selectedIds.size
              }{" "}
              selected

            </Badge>


            <Button
              size="sm"
              variant="outline"
            >

              Activate

            </Button>


            <Button
              size="sm"
              variant="outline"
            >

              Deactivate

            </Button>


            <Button
              size="sm"
              variant="outline"
            >

              <Download
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Export

            </Button>


            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={
                clearSelection
              }
            >

              Clear selection

            </Button>

          </div>

        )}


        {/* ====================================================
            FETCHING INDICATOR
        ==================================================== */}

        {isFetching &&
          !isLoading && (

          <div
            className="
              flex
              items-center
              gap-2
              border-b
              bg-muted/20
              px-4
              py-2
              text-xs
              text-muted-foreground
            "
          >

            <Loader2
              className="
                h-3.5
                w-3.5
                animate-spin
              "
            />

            Updating results...

          </div>

        )}


        {/* ====================================================
            TABLE VIEW
        ==================================================== */}

        {viewMode ===
          "table" && (

          <div
            className="
              relative
              overflow-x-auto
            "
          >

            <Table>

              <TableHeader>

                <TableRow
                  className="
                    bg-muted/20
                    hover:bg-muted/20
                  "
                >

                  <TableHead
                    className="
                      w-[48px]
                    "
                  >

                    <input
                      type="checkbox"
                      checked={
                        allVisibleSelected
                      }
                      onChange={
                        toggleSelectAll
                      }
                      aria-label="
                        Select all organizations
                      "
                      className="
                        h-4
                        w-4
                        rounded
                        border
                      "
                    />

                  </TableHead>


                  {visibleColumns.organization && (

                    <SortableHeader
                      label="Organization"
                      sortKey="orgName"
                      currentSort={
                        filters.sortBy
                      }
                      direction={
                        filters.sortDirection
                      }
                      onSort={
                        changeSort
                      }
                      className="
                        min-w-[280px]
                      "
                    />

                  )}


                  {visibleColumns.businessType && (

                    <SortableHeader
                      label="Business Type"
                      sortKey="businessType"
                      currentSort={
                        filters.sortBy
                      }
                      direction={
                        filters.sortDirection
                      }
                      onSort={
                        changeSort
                      }
                      className="
                        min-w-[160px]
                      "
                    />

                  )}


                  {visibleColumns.location && (

                    <TableHead
                      className="
                        min-w-[200px]
                      "
                    >

                      Location

                    </TableHead>

                  )}


                  {visibleColumns.contact && (

                    <TableHead
                      className="
                        min-w-[240px]
                      "
                    >

                      Contact

                    </TableHead>

                  )}


                  {visibleColumns.status && (

                    <TableHead
                      className="
                        min-w-[110px]
                      "
                    >

                      Status

                    </TableHead>

                  )}


                  {visibleColumns.created && (

                    <SortableHeader
                      label="Created"
                      sortKey="createdAt"
                      currentSort={
                        filters.sortBy
                      }
                      direction={
                        filters.sortDirection
                      }
                      onSort={
                        changeSort
                      }
                      className="
                        min-w-[130px]
                      "
                    />

                  )}


                  {visibleColumns.updated && (

                    <SortableHeader
                      label="Updated"
                      sortKey="updatedAt"
                      currentSort={
                        filters.sortBy
                      }
                      direction={
                        filters.sortDirection
                      }
                      onSort={
                        changeSort
                      }
                      className="
                        min-w-[130px]
                      "
                    />

                  )}


                  <TableHead
                    className="
                      w-[60px]
                    "
                  />

                </TableRow>

              </TableHeader>


              <TableBody>

                {isLoading && (

                  <TableRow>

                    <TableCell
                      colSpan={
                        visibleColumnCount +
                        2
                      }
                      className="
                        h-72
                      "
                    >

                      <LoadingState />

                    </TableCell>

                  </TableRow>

                )}


                {!isLoading &&
                  isError && (

                  <TableRow>

                    <TableCell
                      colSpan={
                        visibleColumnCount +
                        2
                      }
                      className="
                        h-72
                      "
                    >

                      <ErrorState
                        message={
                          error instanceof
                          Error
                            ? error.message
                            : "Failed to load organizations."
                        }
                        onRetry={
                          refetch
                        }
                      />

                    </TableCell>

                  </TableRow>

                )}


                {!isLoading &&
                  !isError &&
                  organizations.length ===
                    0 && (

                  <TableRow>

                    <TableCell
                      colSpan={
                        visibleColumnCount +
                        2
                      }
                      className="
                        h-72
                      "
                    >

                      <EmptyState
                        hasFilters={
                          activeFilters.length >
                          0
                        }
                        onClear={
                          clearFilters
                        }
                      />

                    </TableCell>

                  </TableRow>

                )}


                {!isLoading &&
                  !isError &&
                  organizations.map(
                    (
                      organization
                    ) => (

                      <OrganizationTableRow
                        key={
                          organization.id
                        }
                        organization={
                          organization
                        }
                        visibleColumns={
                          visibleColumns
                        }
                        selected={
                          selectedIds.has(
                            organization.id
                          )
                        }
                        onSelect={() =>
                          toggleSelected(
                            organization.id
                          )
                        }
                        onView={() =>
                          navigate(
                            `/organizations/${organization.id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/organizations/${organization.id}/edit`
                          )
                        }
                        cellClassName={
                          tableCellClass
                        }
                      />

                    )
                  )}

              </TableBody>

            </Table>

          </div>

        )}


        {/* ====================================================
            LIST VIEW
        ==================================================== */}

        {viewMode ===
          "list" && (

          <div>

            {isLoading ? (

              <div className="p-12">

                <LoadingState />

              </div>

            ) : isError ? (

              <div className="p-12">

                <ErrorState
                  message={
                    error instanceof
                    Error
                      ? error.message
                      : "Failed to load organizations."
                  }
                  onRetry={
                    refetch
                  }
                />

              </div>

            ) : organizations.length ===
              0 ? (

              <div className="p-12">

                <EmptyState
                  hasFilters={
                    activeFilters.length >
                    0
                  }
                  onClear={
                    clearFilters
                  }
                />

              </div>

            ) : (

              <div
                className="
                  divide-y
                "
              >

                {organizations.map(
                  (
                    organization
                  ) => {

                    const contact =
                      getContact(
                        organization
                      );


                    return (

                      <OrganizationListItem
                        key={
                          organization.id
                        }
                        organization={
                          organization
                        }
                        contact={
                          contact
                        }
                        selected={
                          selectedIds.has(
                            organization.id
                          )
                        }
                        onSelect={() =>
                          toggleSelected(
                            organization.id
                          )
                        }
                        onView={() =>
                          navigate(
                            `/organizations/${organization.id}`
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/organizations/${organization.id}/edit`
                          )
                        }
                      />

                    );

                  }
                )}

              </div>

            )}

          </div>

        )}


        {/* ====================================================
            CARD VIEW
        ==================================================== */}

        {viewMode ===
          "card" && (

          <div className="p-4">

            {isLoading ? (

              <div className="py-12">

                <LoadingState />

              </div>

            ) : isError ? (

              <div className="py-12">

                <ErrorState
                  message={
                    error instanceof
                    Error
                      ? error.message
                      : "Failed to load organizations."
                  }
                  onRetry={
                    refetch
                  }
                />

              </div>

            ) : organizations.length ===
              0 ? (

              <div className="py-12">

                <EmptyState
                  hasFilters={
                    activeFilters.length >
                    0
                  }
                  onClear={
                    clearFilters
                  }
                />

              </div>

            ) : (

              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-2
                  xl:grid-cols-3
                  2xl:grid-cols-4
                "
              >

                {organizations.map(
                  (
                    organization
                  ) => (

                    <OrganizationCard
                      key={
                        organization.id
                      }
                      organization={
                        organization
                      }
                      selected={
                        selectedIds.has(
                          organization.id
                        )
                      }
                      onSelect={() =>
                        toggleSelected(
                          organization.id
                        )
                      }
                      onView={() =>
                        navigate(
                          `/organizations/${organization.id}`
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/organizations/${organization.id}/edit`
                        )
                      }
                    />

                  )
                )}

              </div>

            )}

          </div>

        )}


        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!isLoading &&
          !isError &&
          totalElements > 0 && (

          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              px-4
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div
              className="
                text-sm
                text-muted-foreground
              "
            >

              Showing{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >

                {firstItem}

              </span>

              {" "}–{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >

                {lastItem}

              </span>

              {" "}of{" "}

              <span
                className="
                  font-medium
                  text-foreground
                "
              >

                {totalElements}

              </span>

            </div>


            <div
              className="
                flex
                items-center
                gap-2
              "
            >

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

                  clearSelection();

                }}
              >

                <SelectTrigger
                  className="
                    h-8
                    w-[105px]
                  "
                >

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
                type="button"
                variant="outline"
                size="icon"
                className="
                  h-8
                  w-8
                "
                disabled={
                  !canPrevious ||
                  isFetching
                }
                onClick={() => {

                  setPage(
                    (current) =>
                      Math.max(
                        current - 1,
                        0
                      )
                  );

                  clearSelection();

                }}
              >

                <ChevronLeft
                  className="
                    h-4
                    w-4
                  "
                />

              </Button>


              <span
                className="
                  min-w-[70px]
                  text-center
                  text-sm
                "
              >

                {page + 1}

                {" / "}

                {Math.max(
                  totalPages,
                  1
                )}

              </span>


              <Button
                type="button"
                variant="outline"
                size="icon"
                className="
                  h-8
                  w-8
                "
                disabled={
                  !canNext ||
                  isFetching
                }
                onClick={() => {

                  setPage(
                    (current) =>
                      current + 1
                  );

                  clearSelection();

                }}
              >

                <ChevronRight
                  className="
                    h-4
                    w-4
                  "
                />

              </Button>

            </div>

          </div>

        )}

      </Card>


      {/* ======================================================
          ADVANCED FILTER SHEET
      ====================================================== */}

      <Sheet
        open={
          advancedFilterOpen
        }
        onOpenChange={
          setAdvancedFilterOpen
        }
      >

        <SheetContent
          side="right"
          className="
            flex
            w-full
            flex-col
            p-0
            sm:max-w-[460px]
          "
        >

          <SheetHeader
            className="
              border-b
              px-6
              py-5
            "
          >

            <SheetTitle
              className="
                flex
                items-center
                gap-2
              "
            >

              <Filter
                className="
                  h-5
                  w-5
                  text-primary
                "
              />

              Advanced Filters

            </SheetTitle>


            <SheetDescription>

              Refine organizations using
              multiple criteria.

            </SheetDescription>

          </SheetHeader>


          {/* FILTER CONTENT */}

          <div
            className="
              flex-1
              overflow-y-auto
              px-6
              py-5
            "
          >

            <div className="space-y-7">

              {/* ============================================
                  ORGANIZATION
              ============================================ */}

              <FilterSection
                title="Organization"
                description="
                  Search by organization information.
                "
              >

                <FilterField
                  label="Organization name"
                >

                  <Input
                    value={
                      draftFilters.search
                    }
                    onChange={(
                      event
                    ) =>
                      setDraftFilters(
                        (current) => ({
                          ...current,

                          search:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="
                      Contains organization name...
                    "
                  />

                </FilterField>

              </FilterSection>


              <Separator />


              {/* ============================================
                  BUSINESS
              ============================================ */}

              <FilterSection
                title="Business"
                description="
                  Filter organizations by business classification.
                "
              >

                <FilterField
                  label="Business type"
                >

                  <Select
                    value={
                      draftFilters.businessType ||
                      "ALL"
                    }
                    onValueChange={(
                      value
                    ) =>
                      setDraftFilters(
                        (current) => ({
                          ...current,

                          businessType:
                            value ===
                            "ALL"
                              ? ""
                              : value,
                        })
                      )
                    }
                  >

                    <SelectTrigger>

                      <SelectValue
                        placeholder="
                          Select business type
                        "
                      />

                    </SelectTrigger>


                    <SelectContent>

                      <SelectItem value="ALL">

                        All business types

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

                </FilterField>

              </FilterSection>


              <Separator />


              {/* ============================================
                  LOCATION
              ============================================ */}

              <FilterSection
                title="Location"
                description="
                  Narrow organizations by geographic location.
                "
              >

                <div
                  className="
                    grid
                    gap-4
                  "
                >

                  <FilterField
                    label="Country"
                  >

                    <Input
                      value={
                        draftFilters.country
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            country:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="
                        e.g. India
                      "
                    />

                  </FilterField>


                  <FilterField
                    label="State"
                  >

                    <Input
                      value={
                        draftFilters.state
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            state:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="
                        e.g. Tamil Nadu
                      "
                    />

                  </FilterField>


                  <FilterField
                    label="City"
                  >

                    <Input
                      value={
                        draftFilters.city
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            city:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="
                        e.g. Chennai
                      "
                    />

                  </FilterField>

                </div>

              </FilterSection>


              <Separator />


              {/* ============================================
                  CONTACT
              ============================================ */}

              <FilterSection
                title="Contact"
                description="
                  Search using the organization's primary contact.
                "
              >

                <div
                  className="
                    grid
                    gap-4
                  "
                >

                  <FilterField
                    label="Contact name"
                  >

                    <Input
                      value={
                        draftFilters.contactName
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            contactName:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="
                        e.g. Jaspher Sujin
                      "
                    />

                  </FilterField>


                  <FilterField
                    label="Contact email"
                  >

                    <Input
                      type="email"
                      value={
                        draftFilters.contactEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            contactEmail:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="
                        e.g. contact@example.com
                      "
                    />

                  </FilterField>

                </div>

              </FilterSection>


              <Separator />


              {/* ============================================
                  STATUS
              ============================================ */}

              <FilterSection
                title="Status"
                description="
                  Select the lifecycle state of the organization.
                "
              >

                <Select
                  value={
                    draftFilters.status
                  }
                  onValueChange={(
                    value
                  ) =>
                    setDraftFilters(
                      (current) => ({
                        ...current,

                        status:
                          value,
                      })
                    )
                  }
                >

                  <SelectTrigger>

                    <SelectValue />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectItem value="ALL">
                      All
                    </SelectItem>

                    <SelectItem value="ACTIVE">
                      Active
                    </SelectItem>

                    <SelectItem value="INACTIVE">
                      Inactive
                    </SelectItem>

                  </SelectContent>

                </Select>

              </FilterSection>


              <Separator />


              {/* ============================================
                  DATE
              ============================================ */}

              <FilterSection
                title="Created date"
                description="
                  Filter organizations by creation date.
                "
              >

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3
                  "
                >

                  <FilterField
                    label="From"
                  >

                    <Input
                      type="date"
                      value={
                        draftFilters.createdFrom
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            createdFrom:
                              event.target.value,
                          })
                        )
                      }
                    />

                  </FilterField>


                  <FilterField
                    label="To"
                  >

                    <Input
                      type="date"
                      value={
                        draftFilters.createdTo
                      }
                      onChange={(
                        event
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            createdTo:
                              event.target.value,
                          })
                        )
                      }
                    />

                  </FilterField>

                </div>

              </FilterSection>


              <Separator />


              {/* ============================================
                  SORT
              ============================================ */}

              <FilterSection
                title="Sorting"
                description="
                  Control the order of the results.
                "
              >

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3
                  "
                >

                  <FilterField
                    label="Sort by"
                  >

                    <Select
                      value={
                        draftFilters.sortBy
                      }
                      onValueChange={(
                        value
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            sortBy:
                              value,
                          })
                        )
                      }
                    >

                      <SelectTrigger>

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

                  </FilterField>


                  <FilterField
                    label="Order"
                  >

                    <Select
                      value={
                        draftFilters.sortDirection
                      }
                      onValueChange={(
                        value
                      ) =>
                        setDraftFilters(
                          (current) => ({
                            ...current,

                            sortDirection:
                              value,
                          })
                        )
                      }
                    >

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>


                      <SelectContent>

                        <SelectItem value="DESC">
                          Descending
                        </SelectItem>

                        <SelectItem value="ASC">
                          Ascending
                        </SelectItem>

                      </SelectContent>

                    </Select>

                  </FilterField>

                </div>

              </FilterSection>

            </div>

          </div>


          {/* FILTER FOOTER */}

          <SheetFooter
            className="
              border-t
              bg-background
              px-6
              py-4
            "
          >

            <Button
              type="button"
              variant="outline"
              onClick={
                resetDraftFilters
              }
            >

              <RotateCcw
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Reset

            </Button>


            <Button
              type="button"
              onClick={
                applyAdvancedFilters
              }
            >

              <Check
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Apply Filters

            </Button>

          </SheetFooter>

        </SheetContent>

      </Sheet>

    </div>

  );

}


/* ============================================================
   TABLE ROW
============================================================ */

interface OrganizationTableRowProps {

  organization: Organization;

  visibleColumns:
    Record<ColumnKey, boolean>;

  selected: boolean;

  onSelect: () => void;

  onView: () => void;

  onEdit: () => void;

  cellClassName: string;

}


function OrganizationTableRow({
  organization,

  visibleColumns,

  selected,

  onSelect,

  onView,

  onEdit,

  cellClassName,

}: OrganizationTableRowProps) {

  const contact =
    getContact(
      organization
    );


  const logo =
    getLogoUrl(
      organization.orgLogo
    );


  const active =
    organization.active &&
    !organization.deleted;


  return (

    <TableRow
      data-state={
        selected
          ? "selected"
          : undefined
      }
      className="
        group
        transition-colors
      "
    >

      {/* SELECTION */}

      <TableCell
        className={
          cellClassName
        }
      >

        <input
          type="checkbox"
          checked={
            selected
          }
          onChange={
            onSelect
          }
          aria-label={`Select ${organization.orgName}`}
          className="
            h-4
            w-4
            rounded
            border
          "
        />

      </TableCell>


      {/* ORGANIZATION */}

      {visibleColumns.organization && (

        <TableCell
          className={
            cellClassName
          }
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            {logo ? (

              <img
                src={logo}
                alt=""
                className="
                  h-10
                  w-10
                  shrink-0
                  rounded-lg
                  border
                  bg-background
                  object-cover
                "
              />

            ) : (

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border
                  bg-muted
                  text-xs
                  font-semibold
                "
              >

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
                onClick={
                  onView
                }
                className="
                  max-w-[260px]
                  truncate
                  text-left
                  text-sm
                  font-medium
                  hover:text-primary
                  hover:underline
                "
              >

                {
                  organization.orgName
                }

              </button>


              <p
                className="
                  mt-0.5
                  max-w-[260px]
                  truncate
                  font-mono
                  text-[11px]
                  text-muted-foreground
                "
              >

                {organization.id}

              </p>

            </div>

          </div>

        </TableCell>

      )}


      {/* BUSINESS TYPE */}

      {visibleColumns.businessType && (

        <TableCell
          className={
            cellClassName
          }
        >

          <Badge
            variant="secondary"
            className="
              font-normal
            "
          >

            {
              formatBusinessType(
                organization.businessType
              )
            }

          </Badge>

        </TableCell>

      )}


      {/* LOCATION */}

      {visibleColumns.location && (

        <TableCell
          className={
            cellClassName
          }
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-1.5
                text-sm
              "
            >

              <MapPin
                className="
                  h-3.5
                  w-3.5
                  text-muted-foreground
                "
              />

              <span>

                {
                  organization.city ??
                  "-"
                }

                {organization.state
                  ? `, ${organization.state}`
                  : ""}

              </span>

            </div>


            <p
              className="
                mt-0.5
                pl-5
                text-xs
                text-muted-foreground
              "
            >

              {
                organization.country ??
                "-"
              }

            </p>

          </div>

        </TableCell>

      )}


      {/* CONTACT */}

      {visibleColumns.contact && (

        <TableCell
          className={
            cellClassName
          }
        >

          {contact ? (

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                "
              >

                <UserRound
                  className="
                    h-3.5
                    w-3.5
                    text-muted-foreground
                  "
                />

                <p
                  className="
                    text-sm
                    font-medium
                  "
                >

                  {
                    getContactName(
                      contact
                    )
                  }

                </p>

              </div>


              <p
                className="
                  mt-0.5
                  max-w-[220px]
                  truncate
                  pl-5
                  text-xs
                  text-muted-foreground
                "
              >

                {
                  contact.designation ??
                  contact.email ??
                  "-"
                }

              </p>

            </div>

          ) : (

            <span
              className="
                text-sm
                text-muted-foreground
              "
            >

              No contact

            </span>

          )}

        </TableCell>

      )}


      {/* STATUS */}

      {visibleColumns.status && (

        <TableCell
          className={
            cellClassName
          }
        >

          <StatusBadge
            active={
              active
            }
          />

        </TableCell>

      )}


      {/* CREATED */}

      {visibleColumns.created && (

        <TableCell
          className={
            cellClassName
          }
        >

          <span
            className="
              whitespace-nowrap
              text-sm
              text-muted-foreground
            "
          >

            {
              formatDate(
                organization.createdAt
              )
            }

          </span>

        </TableCell>

      )}


      {/* UPDATED */}

      {visibleColumns.updated && (

        <TableCell
          className={
            cellClassName
          }
        >

          <span
            className="
              whitespace-nowrap
              text-sm
              text-muted-foreground
            "
          >

            {
              formatDate(
                organization.updatedAt
              )
            }

          </span>

        </TableCell>

      )}


      {/* ACTIONS */}

      <TableCell
        className={
          cellClassName
        }
      >

        <OrganizationActions
          onView={
            onView
          }
          onEdit={
            onEdit
          }
        />

      </TableCell>

    </TableRow>

  );

}


/* ============================================================
   LIST ITEM
============================================================ */

interface OrganizationListItemProps {

  organization: Organization;

  contact:
    OrganizationContact |
    null;

  selected: boolean;

  onSelect: () => void;

  onView: () => void;

  onEdit: () => void;

}


function OrganizationListItem({
  organization,

  contact,

  selected,

  onSelect,

  onView,

  onEdit,

}: OrganizationListItemProps) {

  const logo =
    getLogoUrl(
      organization.orgLogo
    );


  const active =
    organization.active &&
    !organization.deleted;


  return (

    <div
      className="
        flex
        flex-col
        gap-4
        p-4
        transition-colors
        hover:bg-muted/30
        lg:flex-row
        lg:items-center
      "
    >

      <div
        className="
          flex
          items-start
          gap-3
        "
      >

        <input
          type="checkbox"
          checked={
            selected
          }
          onChange={
            onSelect
          }
          className="
            mt-3
            h-4
            w-4
            rounded
            border
          "
          aria-label={`Select ${organization.orgName}`}
        />


        {logo ? (

          <img
            src={logo}
            alt=""
            className="
              h-12
              w-12
              shrink-0
              rounded-xl
              border
              object-cover
            "
          />

        ) : (

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              bg-muted
              text-xs
              font-semibold
            "
          >

            {
              getInitials(
                organization.orgName
              )
            }

          </div>

        )}

      </div>


      <div
        className="
          min-w-0
          flex-1
        "
      >

        <button
          type="button"
          onClick={
            onView
          }
          className="
            text-left
            text-sm
            font-semibold
            hover:text-primary
            hover:underline
          "
        >

          {
            organization.orgName
          }

        </button>


        <div
          className="
            mt-1
            flex
            flex-wrap
            items-center
            gap-x-3
            gap-y-1
            text-xs
            text-muted-foreground
          "
        >

          <span>

            {
              formatBusinessType(
                organization.businessType
              )
            }

          </span>


          <span>

            •

          </span>


          <span>

            {
              organization.city ??
              "-"
            }

            {organization.state
              ? `, ${organization.state}`
              : ""}

          </span>

        </div>

      </div>


      <div
        className="
          min-w-0
          lg:w-[250px]
        "
      >

        {contact ? (

          <>

            <p
              className="
                truncate
                text-sm
                font-medium
              "
            >

              {
                getContactName(
                  contact
                )
              }

            </p>


            <p
              className="
                truncate
                text-xs
                text-muted-foreground
              "
            >

              {
                contact.designation ??
                contact.email
              }

            </p>

          </>

        ) : (

          <span
            className="
              text-sm
              text-muted-foreground
            "
          >

            No contact

          </span>

        )}

      </div>


      <div
        className="
          flex
          items-center
          gap-3
        "
      >

        <StatusBadge
          active={
            active
          }
        />


        <OrganizationActions
          onView={
            onView
          }
          onEdit={
            onEdit
          }
        />

      </div>

    </div>

  );

}


/* ============================================================
   CARD
============================================================ */

interface OrganizationCardProps {

  organization: Organization;

  selected: boolean;

  onSelect: () => void;

  onView: () => void;

  onEdit: () => void;

}


function OrganizationCard({
  organization,

  selected,

  onSelect,

  onView,

  onEdit,

}: OrganizationCardProps) {

  const contact =
    getContact(
      organization
    );


  const logo =
    getLogoUrl(
      organization.orgLogo
    );


  const active =
    organization.active &&
    !organization.deleted;


  return (

    <Card
      className={`
        group
        overflow-hidden
        transition-all
        hover:-translate-y-0.5
        hover:shadow-md
        ${
          selected
            ? "ring-2 ring-primary/30"
            : ""
        }
      `}
    >

      <CardContent
        className="
          p-5
        "
      >

        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            {logo ? (

              <img
                src={logo}
                alt=""
                className="
                  h-12
                  w-12
                  rounded-xl
                  border
                  object-cover
                "
              />

            ) : (

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  border
                  bg-muted
                  text-xs
                  font-semibold
                "
              >

                {
                  getInitials(
                    organization.orgName
                  )
                }

              </div>

            )}


            <div
              className="
                min-w-0
              "
            >

              <button
                type="button"
                onClick={
                  onView
                }
                className="
                  max-w-[190px]
                  truncate
                  text-left
                  text-sm
                  font-semibold
                  hover:text-primary
                  hover:underline
                "
              >

                {
                  organization.orgName
                }

              </button>


              <p
                className="
                  mt-0.5
                  truncate
                  text-xs
                  text-muted-foreground
                "
              >

                {
                  formatBusinessType(
                    organization.businessType
                  )
                }

              </p>

            </div>

          </div>


          <input
            type="checkbox"
            checked={
              selected
            }
            onChange={
              onSelect
            }
            className="
              h-4
              w-4
              rounded
              border
            "
            aria-label={`Select ${organization.orgName}`}
          />

        </div>


        <div
          className="
            mt-5
            flex
            items-center
            justify-between
          "
        >

          <StatusBadge
            active={
              active
            }
          />


          <OrganizationActions
            onView={
              onView
            }
            onEdit={
              onEdit
            }
          />

        </div>


        <Separator
          className="
            my-4
          "
        />


        {/* LOCATION */}

        <div
          className="
            flex
            items-start
            gap-2
          "
        >

          <MapPin
            className="
              mt-0.5
              h-4
              w-4
              shrink-0
              text-muted-foreground
            "
          />


          <div>

            <p
              className="
                text-sm
              "
            >

              {
                organization.city ??
                "-"
              }

              {organization.state
                ? `, ${organization.state}`
                : ""}

            </p>


            <p
              className="
                text-xs
                text-muted-foreground
              "
            >

              {
                organization.country ??
                "-"
              }

            </p>

          </div>

        </div>


        {/* CONTACT */}

        {contact && (

          <div
            className="
              mt-4
              space-y-2
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <UserRound
                className="
                  h-4
                  w-4
                  text-muted-foreground
                "
              />


              <div
                className="
                  min-w-0
                "
              >

                <p
                  className="
                    truncate
                    text-sm
                    font-medium
                  "
                >

                  {
                    getContactName(
                      contact
                    )
                  }

                </p>


                <p
                  className="
                    truncate
                    text-xs
                    text-muted-foreground
                  "
                >

                  {
                    contact.designation ??
                    "-"
                  }

                </p>

              </div>

            </div>


            {contact.email && (

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Mail
                  className="
                    h-3.5
                    w-3.5
                    text-muted-foreground
                  "
                />


                <span
                  className="
                    truncate
                    text-xs
                    text-muted-foreground
                  "
                >

                  {
                    contact.email
                  }

                </span>

              </div>

            )}


            {contact.phoneNumber && (

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Phone
                  className="
                    h-3.5
                    w-3.5
                    text-muted-foreground
                  "
                />


                <span
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >

                  {
                    contact.countryCode
                  }{" "}

                  {
                    contact.phoneNumber
                  }

                </span>

              </div>

            )}

          </div>

        )}


        <p
          className="
            mt-4
            text-[11px]
            text-muted-foreground
          "
        >

          Created{" "}

          {
            formatDate(
              organization.createdAt
            )
          }

        </p>

      </CardContent>

    </Card>

  );

}


/* ============================================================
   ACTIONS
============================================================ */

interface OrganizationActionsProps {

  onView: () => void;

  onEdit: () => void;

}


function OrganizationActions({
  onView,

  onEdit,

}: OrganizationActionsProps) {

  return (

    <DropdownMenu>

      <DropdownMenuTrigger
        asChild
      >

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="
            h-8
            w-8
          "
        >

          <MoreHorizontal
            className="
              h-4
              w-4
            "
          />

          <span className="sr-only">

            Organization actions

          </span>

        </Button>

      </DropdownMenuTrigger>


      <DropdownMenuContent
        align="end"
        className="w-44"
      >

        <DropdownMenuItem
          onClick={
            onView
          }
        >

          <Eye
            className="
              mr-2
              h-4
              w-4
            "
          />

          View

        </DropdownMenuItem>


        <DropdownMenuItem
          onClick={
            onEdit
          }
        >

          <Pencil
            className="
              mr-2
              h-4
              w-4
            "
          />

          Edit

        </DropdownMenuItem>


        <DropdownMenuSeparator />


        <DropdownMenuItem
          className="
            text-destructive
            focus:text-destructive
          "
        >

          <Trash2
            className="
              mr-2
              h-4
              w-4
            "
          />

          Deactivate

        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>

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

  return (

    <Badge
      variant="outline"
      className={
        active
          ? `
            border-emerald-500/30
            bg-emerald-500/10
            text-emerald-700
          `
          : `
            border-amber-500/30
            bg-amber-500/10
            text-amber-700
          `
      }
    >

      <span
        className={`
          mr-1.5
          h-1.5
          w-1.5
          rounded-full
          ${
            active
              ? "bg-emerald-500"
              : "bg-amber-500"
          }
        `}
      />


      {active
        ? "Active"
        : "Inactive"}

    </Badge>

  );

}


/* ============================================================
   SORTABLE HEADER
============================================================ */

interface SortableHeaderProps {

  label: string;

  sortKey: string;

  currentSort: string;

  direction: string;

  onSort: (
    sortKey: string
  ) => void;

  className?: string;

}


function SortableHeader({
  label,

  sortKey,

  currentSort,

  direction,

  onSort,

  className = "",

}: SortableHeaderProps) {

  const active =
    currentSort ===
    sortKey;


  return (

    <TableHead
      className={
        className
      }
    >

      <button
        type="button"
        onClick={() =>
          onSort(
            sortKey
          )
        }
        className="
          flex
          items-center
          gap-1.5
          text-xs
          font-semibold
          hover:text-foreground
        "
      >

        {label}


        {active ? (

          direction ===
          "ASC" ? (

            <ArrowUp
              className="
                h-3.5
                w-3.5
                text-primary
              "
            />

          ) : (

            <ArrowDown
              className="
                h-3.5
                w-3.5
                text-primary
              "
            />

          )

        ) : (

          <ArrowDown
            className="
              h-3
              w-3
              opacity-30
            "
          />

        )}

      </button>

    </TableHead>

  );

}


/* ============================================================
   VIEW BUTTON
============================================================ */

interface ViewButtonProps {

  active: boolean;

  icon: React.ReactNode;

  label: string;

  onClick: () => void;

}


function ViewButton({
  active,

  icon,

  label,

  onClick,

}: ViewButtonProps) {

  return (

    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={
        onClick
      }
      className={`
        flex
        h-7
        w-8
        items-center
        justify-center
        rounded
        transition-colors
        ${
          active
            ? "bg-muted text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }
      `}
    >

      {icon}

    </button>

  );

}


/* ============================================================
   FILTER SECTION
============================================================ */

interface FilterSectionProps {

  title: string;

  description?: string;

  children: React.ReactNode;

}


function FilterSection({
  title,

  description,

  children,

}: FilterSectionProps) {

  return (

    <section
      className="
        space-y-4
      "
    >

      <div>

        <h3
          className="
            text-sm
            font-semibold
          "
        >

          {title}

        </h3>


        {description && (

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-muted-foreground
            "
          >

            {description}

          </p>

        )}

      </div>


      {children}

    </section>

  );

}


/* ============================================================
   FILTER FIELD
============================================================ */

interface FilterFieldProps {

  label: string;

  children: React.ReactNode;

}


function FilterField({
  label,

  children,

}: FilterFieldProps) {

  return (

    <div
      className="
        space-y-2
      "
    >

      <label
        className="
          text-xs
          font-medium
          text-muted-foreground
        "
      >

        {label}

      </label>


      {children}

    </div>

  );

}


/* ============================================================
   LOADING
============================================================ */

function LoadingState() {

  return (

    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        text-center
      "
    >

      <Loader2
        className="
          h-7
          w-7
          animate-spin
          text-primary
        "
      />


      <p
        className="
          mt-3
          text-sm
          font-medium
        "
      >

        Loading organizations...

      </p>


      <p
        className="
          mt-1
          text-xs
          text-muted-foreground
        "
      >

        Fetching the latest organization data.

      </p>

    </div>

  );

}


/* ============================================================
   ERROR
============================================================ */

interface ErrorStateProps {

  message: string;

  onRetry: () => void;

}


function ErrorState({
  message,

  onRetry,

}: ErrorStateProps) {

  return (

    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        text-center
      "
    >

      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-full
          bg-destructive/10
        "
      >

        <X
          className="
            h-5
            w-5
            text-destructive
          "
        />

      </div>


      <p
        className="
          mt-3
          font-medium
        "
      >

        Failed to load organizations

      </p>


      <p
        className="
          mt-1
          max-w-md
          text-sm
          text-muted-foreground
        "
      >

        {message}

      </p>


      <Button
        type="button"
        variant="outline"
        size="sm"
        className="
          mt-4
        "
        onClick={
          onRetry
        }
      >

        <RefreshCw
          className="
            mr-2
            h-4
            w-4
          "
        />

        Try Again

      </Button>

    </div>

  );

}


/* ============================================================
   EMPTY
============================================================ */

interface EmptyStateProps {

  hasFilters: boolean;

  onClear: () => void;

}


function EmptyState({
  hasFilters,

  onClear,

}: EmptyStateProps) {

  return (

    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        text-center
      "
    >

      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-muted
        "
      >

        <Building2
          className="
            h-6
            w-6
            text-muted-foreground
          "
        />

      </div>


      <p
        className="
          mt-4
          font-medium
        "
      >

        No organizations found

      </p>


      <p
        className="
          mt-1
          max-w-sm
          text-sm
          text-muted-foreground
        "
      >

        {hasFilters
          ? "No organizations match your current search and filter criteria."
          : "There are no organizations available yet."}

      </p>


      {hasFilters && (

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="
            mt-4
          "
          onClick={
            onClear
          }
        >

          Clear Filters

        </Button>

      )}

    </div>

  );

}