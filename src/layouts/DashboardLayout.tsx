import { Outlet } from "react-router-dom";
import {
  Bell,
  Search,
  UserRound,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Input } from "@/components/ui/input";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="min-w-0 flex-1 overflow-x-hidden">
        {/* ========================================= */}
        {/* TOP HEADER */}
        {/* ========================================= */}

        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <SidebarTrigger />

            <div className="hidden h-5 w-px bg-border sm:block" />

            {/* Search */}
            <div className="relative hidden w-[280px] md:block lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="search"
                placeholder="Search..."
                className="h-9 bg-muted/40 pl-9"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="ml-auto flex items-center gap-2">

            {/* Mobile Search */}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />

              {/* Notification badge */}
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>

            {/* Divider */}
            <div className="mx-1 h-6 w-px bg-border" />

            {/* Profile */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="h-4 w-4 text-primary" />
              </div>

              <div className="hidden text-left lg:block">
                <p className="text-sm font-medium leading-none">
                  Admin User
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Administrator
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* ========================================= */}
        {/* PAGE CONTENT */}
        {/* ========================================= */}

        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}