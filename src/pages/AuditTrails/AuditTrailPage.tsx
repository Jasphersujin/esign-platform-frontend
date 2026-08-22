import React, { useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AuditStatus = "Success" | "Failed" | "Warning";

type AuditEvent = {
  id: string;
  action: string;
  category: string;
  description: string;

  actor: {
    name: string;
    email: string;
    initials: string;
  };

  resource: string;
  resourceType: string;

  ipAddress: string;
  location: string;
  device: string;

  status: AuditStatus;

  timestamp: string;
};

/* -------------------------------------------------------------------------- */
/* Dummy Data                                                                 */
/* -------------------------------------------------------------------------- */

const auditData: AuditEvent[] = [
  {
    id: "AUD-10482",
    action: "Document Signed",
    category: "Document",
    description:
      "Employment Agreement was successfully signed by the recipient.",
    actor: {
      name: "Sarah Johnson",
      email: "sarah.johnson@acme.com",
      initials: "SJ",
    },
    resource: "Employment Agreement",
    resourceType: "Document",
    ipAddress: "103.84.214.21",
    location: "Bengaluru, IN",
    device: "Chrome · Windows",
    status: "Success",
    timestamp: "Aug 22, 2026 · 10:42 AM",
  },

  {
    id: "AUD-10481",
    action: "User Invited",
    category: "User",
    description:
      "A new member was invited to the organization.",
    actor: {
      name: "Michael Chen",
      email: "michael.chen@acme.com",
      initials: "MC",
    },
    resource: "alex.morgan@acme.com",
    resourceType: "User",
    ipAddress: "49.37.112.80",
    location: "Chennai, IN",
    device: "Chrome · macOS",
    status: "Success",
    timestamp: "Aug 22, 2026 · 09:18 AM",
  },

  {
    id: "AUD-10480",
    action: "Permission Changed",
    category: "Security",
    description:
      "Organization administrator permissions were modified.",
    actor: {
      name: "David Wilson",
      email: "david.wilson@acme.com",
      initials: "DW",
    },
    resource: "Alex Morgan",
    resourceType: "User",
    ipAddress: "122.164.82.11",
    location: "Bengaluru, IN",
    device: "Edge · Windows",
    status: "Success",
    timestamp: "Aug 21, 2026 · 06:35 PM",
  },

  {
    id: "AUD-10479",
    action: "Failed Login",
    category: "Authentication",
    description:
      "Multiple unsuccessful authentication attempts detected.",
    actor: {
      name: "Unknown User",
      email: "unknown@example.com",
      initials: "?",
    },
    resource: "Admin Portal",
    resourceType: "Application",
    ipAddress: "185.220.101.45",
    location: "Frankfurt, DE",
    device: "Firefox · Linux",
    status: "Failed",
    timestamp: "Aug 21, 2026 · 03:22 PM",
  },

  {
    id: "AUD-10478",
    action: "API Key Created",
    category: "Developer",
    description:
      "A new production API key was generated.",
    actor: {
      name: "James Anderson",
      email: "james.anderson@acme.com",
      initials: "JA",
    },
    resource: "Production API",
    resourceType: "API Key",
    ipAddress: "14.192.44.82",
    location: "Mumbai, IN",
    device: "Chrome · macOS",
    status: "Success",
    timestamp: "Aug 21, 2026 · 12:47 PM",
  },

  {
    id: "AUD-10477",
    action: "Organization Updated",
    category: "Organization",
    description:
      "Organization profile information was updated.",
    actor: {
      name: "Sarah Johnson",
      email: "sarah.johnson@acme.com",
      initials: "SJ",
    },
    resource: "Acme Corporation",
    resourceType: "Organization",
    ipAddress: "103.84.214.21",
    location: "Bengaluru, IN",
    device: "Chrome · Windows",
    status: "Success",
    timestamp: "Aug 20, 2026 · 04:12 PM",
  },

  {
    id: "AUD-10476",
    action: "Webhook Failed",
    category: "Integration",
    description:
      "Webhook delivery failed after three retry attempts.",
    actor: {
      name: "System",
      email: "system@platform.com",
      initials: "SY",
    },
    resource: "Document Signed Webhook",
    resourceType: "Webhook",
    ipAddress: "Internal",
    location: "AWS ap-south-1",
    device: "Platform",
    status: "Warning",
    timestamp: "Aug 20, 2026 · 01:05 PM",
  },

  {
    id: "AUD-10475",
    action: "Document Viewed",
    category: "Document",
    description:
      "Vendor Agreement was opened by the recipient.",
    actor: {
      name: "Robert Taylor",
      email: "robert.taylor@client.com",
      initials: "RT",
    },
    resource: "Vendor Agreement",
    resourceType: "Document",
    ipAddress: "49.204.72.18",
    location: "Hyderabad, IN",
    device: "Safari · iPhone",
    status: "Success",
    timestamp: "Aug 20, 2026 · 11:31 AM",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const statusClasses = (status: AuditStatus) => {
  if (status === "Success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400";
  }

  if (status === "Failed") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400";
};

const statusIcon = (status: AuditStatus) => {
  if (status === "Success") {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }

  if (status === "Failed") {
    return <XCircle className="h-3.5 w-3.5" />;
  }

  return <AlertCircle className="h-3.5 w-3.5" />;
};

const categoryIcon = (category: string) => {
  switch (category) {
    case "Document":
      return <FileText className="h-4 w-4" />;

    case "User":
      return <UserPlus className="h-4 w-4" />;

    case "Security":
    case "Authentication":
      return <ShieldCheck className="h-4 w-4" />;

    case "Developer":
      return <Activity className="h-4 w-4" />;

    case "Organization":
      return <Users className="h-4 w-4" />;

    default:
      return <Activity className="h-4 w-4" />;
  }
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const AuditTrailPage: React.FC = () => {
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("all");

  const [status, setStatus] = useState("all");

  const [selectedEvent, setSelectedEvent] =
    useState<AuditEvent | null>(null);

  const [page, setPage] = useState(1);

  const pageSize = 6;

  /* ---------------------------------------------------------------------- */
  /* Filter                                                                 */
  /* ---------------------------------------------------------------------- */

  const filteredData = useMemo(() => {
    return auditData.filter((event) => {
      const query = search.toLowerCase();

      const matchesSearch =
        event.id.toLowerCase().includes(query) ||
        event.action.toLowerCase().includes(query) ||
        event.actor.name.toLowerCase().includes(query) ||
        event.actor.email.toLowerCase().includes(query) ||
        event.resource.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" ||
        event.category.toLowerCase() ===
          category.toLowerCase();

      const matchesStatus =
        status === "all" ||
        event.status.toLowerCase() === status.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [search, category, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / pageSize)
  );

  const currentData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ---------------------------------------------------------------------- */
  /* Stats                                                                  */
  /* ---------------------------------------------------------------------- */

  const totalEvents = auditData.length;

  const successCount = auditData.filter(
    (item) => item.status === "Success"
  ).length;

  const failedCount = auditData.filter(
    (item) => item.status === "Failed"
  ).length;

  const securityCount = auditData.filter(
    (item) =>
      item.category === "Security" ||
      item.category === "Authentication"
  ).length;

  /* ---------------------------------------------------------------------- */
  /* Export                                                                 */
  /* ---------------------------------------------------------------------- */

  const exportCSV = () => {
    const headers = [
      "ID",
      "Action",
      "Category",
      "Actor",
      "Resource",
      "Status",
      "IP Address",
      "Location",
      "Device",
      "Timestamp",
    ];

    const rows = filteredData.map((item) => [
      item.id,
      item.action,
      item.category,
      item.actor.email,
      item.resource,
      item.status,
      item.ipAddress,
      item.location,
      item.device,
      item.timestamp,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "audit-trail.csv";

    anchor.click();

    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Security
                <span>/</span>
                Audit Trail
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Audit Trail
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Track every important action performed within
                your organization.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Clock3 className="mr-2 h-4 w-4" />
                Last 30 days
              </Button>

              <Button onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] p-6">
        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <Activity className="h-5 w-5" />
                </div>

                <Badge variant="secondary">
                  30 days
                </Badge>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Total events
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {totalEvents}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 w-fit">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Successful
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {successCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-red-100 p-2.5 text-red-700 dark:bg-red-950/40 dark:text-red-400 w-fit">
                <XCircle className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Failed
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {failedCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 w-fit">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Security events
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {securityCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="mt-6 overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Activity Log
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Immutable record of organization activity.
                </p>
              </div>

              <Badge variant="outline">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Immutable
              </Badge>
            </div>
          </CardHeader>

          {/* Filters */}
          <div className="border-b bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  className="bg-background pl-9"
                  placeholder="Search events, users, resources..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full bg-background lg:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All categories
                  </SelectItem>

                  <SelectItem value="document">
                    Document
                  </SelectItem>

                  <SelectItem value="user">
                    User
                  </SelectItem>

                  <SelectItem value="security">
                    Security
                  </SelectItem>

                  <SelectItem value="authentication">
                    Authentication
                  </SelectItem>

                  <SelectItem value="developer">
                    Developer
                  </SelectItem>

                  <SelectItem value="organization">
                    Organization
                  </SelectItem>

                  <SelectItem value="integration">
                    Integration
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full bg-background lg:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All status
                  </SelectItem>

                  <SelectItem value="success">
                    Success
                  </SelectItem>

                  <SelectItem value="failed">
                    Failed
                  </SelectItem>

                  <SelectItem value="warning">
                    Warning
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedEvent(event)
                    }
                  >
                    {/* Action */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                          {categoryIcon(event.category)}
                        </div>

                        <div>
                          <p className="font-medium">
                            {event.action}
                          </p>

                          <p className="mt-0.5 max-w-[260px] truncate text-xs text-muted-foreground">
                            {event.description}
                          </p>

                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                            {event.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Actor */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">
                            {event.actor.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="text-sm font-medium">
                            {event.actor.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {event.actor.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Resource */}
                    <TableCell>
                      <p className="max-w-[180px] truncate text-sm font-medium">
                        {event.resource}
                      </p>

                      <Badge
                        variant="secondary"
                        className="mt-1 text-[10px]"
                      >
                        {event.resourceType}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5",
                          statusClasses(event.status)
                        )}
                      >
                        {statusIcon(event.status)}
                        {event.status}
                      </Badge>
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      <p className="font-mono text-xs">
                        {event.ipAddress}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.location}
                      </p>
                    </TableCell>

                    {/* Timestamp */}
                    <TableCell>
                      <p className="whitespace-nowrap text-xs font-medium">
                        {event.timestamp}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.device}
                      </p>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setSelectedEvent(event)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>

                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(
                  page * pageSize,
                  filteredData.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredData.length}
              </span>{" "}
              events
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={
                    page === pageNumber
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-8 min-w-8"
                  onClick={() =>
                    setPage(pageNumber)
                  }
                >
                  {pageNumber}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border bg-muted p-3">
                    {categoryIcon(
                      selectedEvent.category
                    )}
                  </div>

                  <div>
                    <DialogTitle>
                      {selectedEvent.action}
                    </DialogTitle>

                    <DialogDescription className="mt-1">
                      {selectedEvent.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Event ID
                  </p>

                  <p className="mt-1 font-mono text-sm">
                    {selectedEvent.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </p>

                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 gap-1.5",
                      statusClasses(
                        selectedEvent.status
                      )
                    )}
                  >
                    {statusIcon(selectedEvent.status)}
                    {selectedEvent.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Actor
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedEvent.actor.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="text-sm font-medium">
                        {selectedEvent.actor.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {selectedEvent.actor.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Resource
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedEvent.resource}
                  </p>

                  <Badge
                    variant="secondary"
                    className="mt-1"
                  >
                    {selectedEvent.resourceType}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    IP Address
                  </p>

                  <p className="mt-1 font-mono text-sm">
                    {selectedEvent.ipAddress}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Location
                  </p>

                  <p className="mt-1 text-sm">
                    {selectedEvent.location}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Device
                  </p>

                  <p className="mt-1 text-sm">
                    {selectedEvent.device}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Timestamp
                  </p>

                  <p className="mt-1 text-sm">
                    {selectedEvent.timestamp}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />

                  <span className="text-sm font-medium">
                    Audit record
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  This event was automatically recorded by the
                  platform. Audit records are immutable and are
                  retained according to the organization's
                  compliance policy.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditTrailPage;