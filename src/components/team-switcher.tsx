
"use client";

import { Link } from "react-router-dom";
// import logo from "../../public/vite.svg";
import logo from "../../public/esignlogo.png"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link to="/">
          <div className="flex justify-center py-0">
            <img
              src={logo}
              alt="eSign"
              className="h-13 w-auto"
            />
          </div>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}