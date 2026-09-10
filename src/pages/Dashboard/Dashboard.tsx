import React from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  Factory,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Progress } from "@/components/ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// -----------------------------------------------------
// Types
// -----------------------------------------------------

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  resource: string;
  status: "Success" | "Pending" | "Failed";
  time: string;
}


// -----------------------------------------------------
// Mock data
// Replace these with API data later
// -----------------------------------------------------

const activities: ActivityItem[] = [
  {
    id: 1,
    user: "John Doe",
    action: "Created",
    resource: "Department",
    status: "Success",
    time: "2 minutes ago",
  },
  {
    id: 2,
    user: "Sarah Smith",
    action: "Updated",
    resource: "Product",
    status: "Success",
    time: "15 minutes ago",
  },
  {
    id: 3,
    user: "Mike Johnson",
    action: "Created",
    resource: "Organization",
    status: "Pending",
    time: "32 minutes ago",
  },
  {
    id: 4,
    user: "David Wilson",
    action: "Deleted",
    resource: "Sidebar",
    status: "Success",
    time: "1 hour ago",
  },
  {
    id: 5,
    user: "Emma Brown",
    action: "Updated",
    resource: "Department",
    status: "Failed",
    time: "2 hours ago",
  },
];


// -----------------------------------------------------
// Small reusable components
// -----------------------------------------------------

const StatusBadge = ({
  status,
}: {
  status: ActivityItem["status"];
}) => {
  if (status === "Success") {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }

  if (status === "Pending") {
    return (
      <Badge className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
        <Clock3 className="h-3 w-3" />
        Pending
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
};


// -----------------------------------------------------
// Dashboard
// -----------------------------------------------------

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-muted/30 p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your organization and system activity.
          </p>
        </div>


        <div className="flex items-center gap-2">

          <Select defaultValue="30">
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="7">
                Last 7 days
              </SelectItem>

              <SelectItem value="30">
                Last 30 days
              </SelectItem>

              <SelectItem value="90">
                Last 90 days
              </SelectItem>
            </SelectContent>
          </Select>


          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

        </div>

      </div>


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Organizations */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">
              Organizations
            </CardTitle>

            <Building2 className="h-5 w-5 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">
              24
            </div>

            <div className="mt-2 flex items-center text-xs text-green-600">

              <ArrowUp className="mr-1 h-3 w-3" />

              12% from last month

            </div>

          </CardContent>
        </Card>


        {/* Departments */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">
              Departments
            </CardTitle>

            <Factory className="h-5 w-5 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">
              156
            </div>

            <div className="mt-2 flex items-center text-xs text-green-600">

              <ArrowUp className="mr-1 h-3 w-3" />

              8.2% from last month

            </div>

          </CardContent>
        </Card>


        {/* Users */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>

            <Users className="h-5 w-5 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">
              1,240
            </div>

            <div className="mt-2 flex items-center text-xs text-green-600">

              <ArrowUp className="mr-1 h-3 w-3" />

              18.4% from last month

            </div>

          </CardContent>
        </Card>


        {/* Products */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">

            <CardTitle className="text-sm font-medium">
              Active Products
            </CardTitle>

            <Package className="h-5 w-5 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">
              348
            </div>

            <div className="mt-2 flex items-center text-xs text-red-600">

              <ArrowDown className="mr-1 h-3 w-3" />

              2.4% from last month

            </div>

          </CardContent>
        </Card>

      </div>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-7">


        {/* =================================================
            ACTIVITY CHART AREA
        ================================================= */}

        <Card className="lg:col-span-4">

          <CardHeader>

            <div className="flex items-center justify-between">

              <div>

                <CardTitle>
                  User Activity
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  User activity over the selected period.
                </p>

              </div>

              <Activity className="h-5 w-5 text-muted-foreground" />

            </div>

          </CardHeader>

          <CardContent>

            {/* Chart placeholder */}

            <div className="flex h-[300px] items-end gap-3 border-b border-l p-4">

              {[45, 70, 55, 80, 65, 90, 75, 100, 85, 110, 95, 120].map(
                (value, index) => (

                  <div
                    key={index}
                    className="flex flex-1 items-end"
                  >

                    <div
                      className="w-full rounded-t-md bg-primary transition-all hover:bg-primary/80"
                      style={{
                        height: `${value * 2}px`,
                      }}
                    />

                  </div>

                )
              )}

            </div>

            <div className="mt-3 flex justify-between text-xs text-muted-foreground">

              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>

            </div>

          </CardContent>

        </Card>


        {/* =================================================
            SYSTEM HEALTH
        ================================================= */}

        <Card className="lg:col-span-3">

          <CardHeader>

            <CardTitle>
              System Health
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-6">


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-green-100 p-2">
                    <Server className="h-5 w-5 text-green-600" />
                  </div>

                  <div>

                    <p className="font-medium">
                      API Server
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Response time: 124ms
                    </p>

                  </div>

                </div>

                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Healthy
                </Badge>

              </div>


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-green-100 p-2">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>

                  <div>

                    <p className="font-medium">
                      Database
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Response time: 42ms
                    </p>

                  </div>

                </div>

                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Healthy
                </Badge>

              </div>


              <div>

                <div className="mb-2 flex justify-between">

                  <span className="text-sm font-medium">
                    Storage
                  </span>

                  <span className="text-sm text-muted-foreground">
                    72%
                  </span>

                </div>

                <Progress value={72} />

              </div>


              <div>

                <div className="mb-2 flex justify-between">

                  <span className="text-sm font-medium">
                    CPU Usage
                  </span>

                  <span className="text-sm text-muted-foreground">
                    46%
                  </span>

                </div>

                <Progress value={46} />

              </div>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* =================================================
          SECOND ROW
      ================================================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">


        {/* Department Overview */}

        <Card>

          <CardHeader>

            <CardTitle>
              Department Overview
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-5">

              <div>

                <div className="mb-2 flex justify-between">

                  <span className="text-sm">
                    Engineering
                  </span>

                  <span className="text-sm font-medium">
                    48
                  </span>

                </div>

                <Progress value={75} />

              </div>


              <div>

                <div className="mb-2 flex justify-between">

                  <span className="text-sm">
                    Operations
                  </span>

                  <span className="text-sm font-medium">
                    32
                  </span>

                </div>

                <Progress value={50} />

              </div>


              <div>

                <div className="mb-2 flex justify-between">

                  <span className="text-sm">
                    Finance
                  </span>

                  <span className="text-sm font-medium">
                    24
                  </span>

                </div>

                <Progress value={38} />

              </div>


              <div>

                <div className="mb-2 flex justify-between">

                  <span className="text-sm">
                    Human Resources
                  </span>

                  <span className="text-sm font-medium">
                    18
                  </span>

                </div>

                <Progress value={28} />

              </div>

            </div>

          </CardContent>

        </Card>


        {/* Product Status */}

        <Card>

          <CardHeader>

            <CardTitle>
              Product Status
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-5">


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <CheckCircle2 className="h-5 w-5 text-green-600" />

                  <span>
                    Active
                  </span>

                </div>

                <span className="font-semibold">
                  284
                </span>

              </div>


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <Clock3 className="h-5 w-5 text-yellow-600" />

                  <span>
                    Pending
                  </span>

                </div>

                <span className="font-semibold">
                  42
                </span>

              </div>


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <XCircle className="h-5 w-5 text-red-600" />

                  <span>
                    Inactive
                  </span>

                </div>

                <span className="font-semibold">
                  22
                </span>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* Quick Actions */}

        <Card>

          <CardHeader>

            <CardTitle>
              Quick Actions
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="grid gap-3">

              <Button
                variant="outline"
                className="justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Organization
              </Button>

              <Button
                variant="outline"
                className="justify-start"
              >
                <Factory className="mr-2 h-4 w-4" />
                Add Department
              </Button>

              <Button
                variant="outline"
                className="justify-start"
              >
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Button>

              <Button
                variant="outline"
                className="justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* =================================================
          RECENT ACTIVITY
      ================================================= */}

      <Card className="mt-6">

        <CardHeader>

          <div className="flex items-center justify-between">

            <div>

              <CardTitle>
                Recent Activity
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Latest activity across your platform.
              </p>

            </div>


            <DropdownMenu>

              <DropdownMenuTrigger asChild>

                <Button
                  variant="ghost"
                  size="icon"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">

                <DropdownMenuItem>
                  View all activity
                </DropdownMenuItem>

                <DropdownMenuItem>
                  Export activity
                </DropdownMenuItem>

              </DropdownMenuContent>

            </DropdownMenu>

          </div>

        </CardHeader>


        <CardContent>

          <Tabs defaultValue="all">

            <TabsList>

              <TabsTrigger value="all">
                All
              </TabsTrigger>

              <TabsTrigger value="success">
                Successful
              </TabsTrigger>

              <TabsTrigger value="pending">
                Pending
              </TabsTrigger>

            </TabsList>


            <TabsContent value="all">

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>
                      User
                    </TableHead>

                    <TableHead>
                      Action
                    </TableHead>

                    <TableHead>
                      Resource
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Time
                    </TableHead>

                  </TableRow>

                </TableHeader>


                <TableBody>

                  {activities.map((activity) => (

                    <TableRow key={activity.id}>

                      <TableCell className="font-medium">
                        {activity.user}
                      </TableCell>

                      <TableCell>
                        {activity.action}
                      </TableCell>

                      <TableCell>
                        {activity.resource}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={activity.status}
                        />
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {activity.time}
                      </TableCell>

                    </TableRow>

                  ))}

                </TableBody>

              </Table>

            </TabsContent>


            <TabsContent value="success">

              <div className="py-8 text-center text-sm text-muted-foreground">
                Successful activity will appear here.
              </div>

            </TabsContent>


            <TabsContent value="pending">

              <div className="py-8 text-center text-sm text-muted-foreground">
                Pending activity will appear here.
              </div>

            </TabsContent>

          </Tabs>

        </CardContent>

      </Card>

    </div>
  );
};

export default Dashboard;