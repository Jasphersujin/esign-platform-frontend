import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function NavUser() {
  const { isMobile } = useSidebar();

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [logoutDialogOpen, setLogoutDialogOpen] =
    useState(false);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  // ============================================================
  // USER
  // ============================================================

  if (!user) {
    return null;
  }

  const userName =
    user.employeeName || "User";

  const userEmail =
    user.email || "";

  const userInitials =
    userName
      .split(" ")
      .map((name: string) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>

            {/* ================================================= */}
            {/* USER BUTTON */}
            {/* ================================================= */}

            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src=""
                    alt={userName}
                  />

                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {userName}
                  </span>

                  <span className="truncate text-xs">
                    {userEmail}
                  </span>
                </div>

                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            {/* ================================================= */}
            {/* DROPDOWN */}
            {/* ================================================= */}

            <DropdownMenuContent
              className="w-56"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >

              {/* USER INFO */}

              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">

                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src=""
                      alt={userName}
                    />

                    <AvatarFallback className="rounded-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {userName}
                    </span>

                    <span className="truncate text-xs">
                      {userEmail}
                    </span>
                  </div>

                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* UPGRADE */}

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <SparklesIcon />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* ACCOUNT */}

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  Account
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <CreditCardIcon />
                  Billing
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* LOGOUT */}

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setLogoutDialogOpen(true);
                }}
                className="cursor-pointer"
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* ====================================================== */}
      {/* LOGOUT CONFIRMATION */}
      {/* ====================================================== */}

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Logout"
        description="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        destructive
        onConfirm={handleLogout}
      />
    </>
  );
}