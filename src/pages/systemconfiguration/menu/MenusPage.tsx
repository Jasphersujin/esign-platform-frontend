import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal,
  Pencil, Plus, RefreshCw, Search, Trash2, Power, PowerOff, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";

import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter,
  SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

interface Menu {
  id: string;
  menuName: string;
  sidebarId?: string | null;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  version?: number;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface SidebarOption {
  id: string;
  displayName?: string;
  sidebarName?: string;
  name?: string;
  active?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

type Status = "ACTIVE" | "INACTIVE" | "ALL";
type ViewMode = "table" | "card";

const DEFAULT_FILTERS = {
  search: "",
  status: "ACTIVE" as Status,
  sidebarId: "",
  standalone: "ALL",
  sortBy: "displayOrder",
  sortDirection: "ASC" as "ASC" | "DESC",
};

const iconNames = [
  "LayoutDashboard","Home","Users","User","Settings","Shield","ShieldCheck",
  "Menu","FileText","Folder","FolderOpen","Database","BarChart3","PieChart",
  "LineChart","Activity","Bell","Calendar","Clock","Search","Building2","Factory",
  "Package","Boxes","ShoppingCart","CreditCard","Wallet","Briefcase",
  "ClipboardList","CheckCircle2","AlertCircle","Info","HelpCircle","Globe",
  "Lock","Key","Mail","MessageSquare","Upload","Download","Eye","Pencil",
  "Trash2","Plus","Layers","Grid2X2","Table2"
];

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? fallback;
}

function unwrap<T>(response: { data: T | ApiEnvelope<T> }): T {
  const value = response.data as T | ApiEnvelope<T>;
  if (value && typeof value === "object" && "data" in (value as object)) {
    return (value as ApiEnvelope<T>).data;
  }
  return value as T;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(date);
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-600">
      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Active
    </Badge>
  ) : (
    <Badge variant="outline" className="border-orange-500/30 bg-orange-500/5 text-orange-600">
      Inactive
    </Badge>
  );
}

function DynamicIcon({ name }: { name?: string | null }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{className?: string}>>)[name || "Menu"]
    ?? LucideIcons.Menu;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
  );
}

async function fetchSidebars(search = ""): Promise<SidebarOption[]> {
  const response = await api.post("/api/v1/sidebars/search", {
    search: search.trim() || null,
    active: true,
    page: 0,
    size: 100,
    sortBy: "displayOrder",
    sortDirection: "ASC",
  });
  const data = unwrap<PageResponse<SidebarOption> | SidebarOption[]>(response);
  return Array.isArray(data) ? data : data.content ?? [];
}

async function fetchMenus(filters: typeof DEFAULT_FILTERS, page: number, size: number) {
  const body = {
    search: filters.search.trim() || null,
    active:
      filters.status === "ACTIVE" ? true :
      filters.status === "INACTIVE" ? false : null,
    sidebarId: filters.sidebarId || null,
    standalone:
      filters.standalone === "STANDALONE" ? true :
      filters.standalone === "SIDEBAR" ? false : null,
    page,
    size,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  };

  const response = await api.post("/api/v1/menus/search", body);
  return unwrap<PageResponse<Menu>>(response);
}

const MenusPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [error, setError] = useState("");

  const sidebarQuery = useQuery({
    queryKey: ["menu-sidebars"],
    queryFn: () => fetchSidebars(),
    staleTime: 60_000,
  });

  const menuQuery = useQuery({
    queryKey: ["menus", filters, page, pageSize],
    queryFn: () => fetchMenus(filters, page, pageSize),
    placeholderData: keepPreviousData,
  });

  const data = menuQuery.data;
  const sidebars = sidebarQuery.data ?? [];
  const sidebarMap = useMemo(
    () => new Map(sidebars.map(s => [s.id, s.displayName ?? s.sidebarName ?? s.name ?? s.id])),
    [sidebars]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setFilters(current => ({ ...current, search: searchInput }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const applyFilters = () => {
    setPage(0);
    setFilters(draft);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchInput("");
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPage(0);
    setFilterOpen(false);
  };

  const runAction = async (id: string, action: "activate" | "deactivate" | "delete") => {
    const labels = { activate: "activate", deactivate: "deactivate", delete: "delete" };
    if (!window.confirm(`Are you sure you want to ${labels[action]} this menu?`)) return;
    try {
      setError("");
      await api[action === "delete" ? "delete" : "put"](`/api/v1/menus/${id}${action === "delete" ? "" : `/${action}`}`);
      await queryClient.invalidateQueries({ queryKey: ["menus"] });
    } catch (e) {
      setError(getErrorMessage(e, `Failed to ${labels[action]} menu.`));
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menus</h1>
          <p className="text-sm text-muted-foreground">
            Manage standalone menus and menus grouped under sidebars.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => menuQuery.refetch()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${menuQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate("/menus/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add Menu
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="ghost" size="icon" onClick={() => setError("")}><X className="h-4 w-4" /></Button>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search menus by name..."
                className="pl-9"
                maxLength={150}
              />
            </div>
            <Select value={filters.status} onValueChange={(v: Status) => { setPage(0); setFilters(f => ({...f, status: v})); }}>
              <SelectTrigger className="w-full lg:w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.standalone} onValueChange={v => { setPage(0); setFilters(f => ({...f, standalone: v})); }}>
              <SelectTrigger className="w-full lg:w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All menu types</SelectItem>
                <SelectItem value="STANDALONE">Standalone</SelectItem>
                <SelectItem value="SIDEBAR">Sidebar menus</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setDraft(filters); setFilterOpen(true); }}>
              Filters
            </Button>
            <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
              <SelectTrigger className="w-full lg:w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="card">Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {menuQuery.isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : menuQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 p-6 text-center text-sm text-destructive">
              Failed to load menus.
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sidebar</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.content ?? []).map(menu => (
                    <TableRow key={menu.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <DynamicIcon name={menu.icon} />
                          <div className="min-w-0">
                            <button className="font-medium hover:underline" onClick={() => navigate(`/menus/${menu.id}`)}>
                              {menu.menuName}
                            </button>
                            {menu.description && (
                              <p className="max-w-[360px] truncate text-xs text-muted-foreground">{menu.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{menu.sidebarId ? "Sidebar" : "Standalone"}</Badge>
                      </TableCell>
                      <TableCell>{menu.sidebarId ? (sidebarMap.get(menu.sidebarId) ?? menu.sidebarId) : "—"}</TableCell>
                      <TableCell>{menu.displayOrder}</TableCell>
                      <TableCell><StatusBadge active={menu.active} /></TableCell>
                      <TableCell>{formatDate(menu.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/menus/${menu.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/menus/${menu.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {menu.active ? (
                              <DropdownMenuItem onClick={() => runAction(menu.id, "deactivate")}>
                                <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => runAction(menu.id, "activate")}>
                                <Power className="mr-2 h-4 w-4" /> Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => runAction(menu.id, "delete")}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.content?.length && (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No menus found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(data?.content ?? []).map(menu => (
                <Card key={menu.id}>
                  <CardContent className="flex gap-3 p-4">
                    <DynamicIcon name={menu.icon} />
                    <div className="min-w-0 flex-1">
                      <button className="font-medium hover:underline" onClick={() => navigate(`/menus/${menu.id}`)}>{menu.menuName}</button>
                      <p className="mt-1 text-xs text-muted-foreground">{menu.sidebarId ? `Sidebar: ${sidebarMap.get(menu.sidebarId) ?? menu.sidebarId}` : "Standalone menu"}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <StatusBadge active={menu.active} />
                        <span className="text-xs text-muted-foreground">Order {menu.displayOrder}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data ? `${data.totalElements} menu${data.totalElements === 1 ? "" : "s"}` : "—"}
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
                <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" disabled={!data || data.first} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[90px] text-center text-sm">{data ? `Page ${data.page + 1} / ${Math.max(data.totalPages, 1)}` : "—"}</span>
              <Button variant="outline" size="icon" disabled={!data || data.last} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu Filters</SheetTitle>
            <SheetDescription>Filter menus by sidebar and menu type.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sidebar</label>
              <Select value={draft.sidebarId || "ALL"} onValueChange={v => setDraft(d => ({...d, sidebarId: v === "ALL" ? "" : v}))}>
                <SelectTrigger><SelectValue placeholder="All sidebars" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sidebars</SelectItem>
                  {sidebars.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.displayName ?? s.sidebarName ?? s.name ?? s.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Menu Type</label>
              <Select value={draft.standalone} onValueChange={v => setDraft(d => ({...d, standalone: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="STANDALONE">Standalone only</SelectItem>
                  <SelectItem value="SIDEBAR">Sidebar only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort</label>
              <Select value={draft.sortBy} onValueChange={v => setDraft(d => ({...d, sortBy: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="displayOrder">Display Order</SelectItem>
                  <SelectItem value="menuName">Menu Name</SelectItem>
                  <SelectItem value="createdAt">Created At</SelectItem>
                  <SelectItem value="updatedAt">Updated At</SelectItem>
                </SelectContent>
              </Select>
              <Select value={draft.sortDirection} onValueChange={(v: "ASC"|"DESC") => setDraft(d => ({...d, sortDirection: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ASC">Ascending</SelectItem><SelectItem value="DESC">Descending</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={clearFilters}>Reset</Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MenusPage;
