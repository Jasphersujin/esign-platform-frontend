"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import {GalleryVerticalEnd} from 'lucide-react'

import sidebarResponse from "../mock/sidebarResponse";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";

const staticData = {
  user: {
    name: "e-sign",
    email: "admin@esign.com",
    avatar: "/avatars/shadcn.jpg",
  },

teams: [
  {
    name: "Acme Inc",
    logo: <GalleryVerticalEnd/>,
    plan: "Enterprise",
  },
]
};

// const getIcon = (iconName?: string) => {
//   if (!iconName) return Icons.Circle;

//   const formatted =
//     iconName.charAt(0).toUpperCase() + iconName.slice(1);

//   const key = formatted as keyof typeof Icons;

//   return Icons[key] ?? Icons.Circle;
// };

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const [navMain, setNavMain] = React.useState<any[]>([]);

  /**
   * Convert backend icon string
   * Example:
   * layoutDashboard -> LayoutDashboard
   * building2 -> Building2
   */
  const getIcon = (iconName?: string) => {
  if (!iconName) return Icons.Circle;

  const formatted =
    iconName.charAt(0).toUpperCase() + iconName.slice(1);

  const key = formatted as keyof typeof Icons;

  return Icons[key] || Icons.Circle;
};

  /**
   * Backend Response
   * --------------
   * FEATURE  -> Standalone Menu
   * SECTION  -> Expandable Menu
   */
  const transformSidebar = (data: any[]) => {
    return data
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((item) => {
        // -------------------------------
        // FEATURE
        // -------------------------------
        if (item.type === "FEATURE") {
          return {
            type: "FEATURE",

            title: item.featureName,

            url: item.route,

            icon: getIcon(item.icon),

            isActive: false,

            items:
              item.screens?.length > 0
                ? item.screens
                    .sort(
                      (a: any, b: any) =>
                        a.displayOrder - b.displayOrder
                    )
                    .map((screen: any) => ({
                      title: screen.name,
                      url: screen.route,
                    }))
                : undefined,
          };
        }

        // -------------------------------
        // SECTION
        // -------------------------------
        if (item.type === "SECTION") {
          return {
            type: "SECTION",

            title: item.sectionName,

            url: "#",

            icon: getIcon(item.icon),

            isActive: false,

            items: item.features
              ?.sort(
                (a: any, b: any) =>
                  a.displayOrder - b.displayOrder
              )
              .map((feature: any) => ({
                title: feature.featureName,
                url: feature.route,
              })),
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  React.useEffect(() => {
    const menus = transformSidebar(sidebarResponse);

    console.log("Sidebar Response", sidebarResponse);

    console.log("Transformed Sidebar", menus);

    setNavMain(menus);
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(props.className)}
    >
      <SidebarHeader>
        {/* <TeamSwitcher teams={staticData.teams} /> */}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={staticData.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}