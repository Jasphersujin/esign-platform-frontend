import React, { useState } from "react";
import {
  Bell,
  Building2,
  ChevronRight,
  Globe2,
  KeyRound,
  Lock,
  Settings2,
  ShieldCheck,
  Users,
  CreditCard,
  Palette,
  Database,
  Webhook,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

type SettingItem = {
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
};

const settingSections: SettingItem[] = [
  {
    title: "Organization",
    description: "Manage your organization profile and workspace details.",
    icon: Building2,
  },
  {
    title: "Members & Roles",
    description: "Manage members, roles, permissions and access.",
    icon: Users,
    badge: "24 members",
  },
  {
    title: "Security",
    description: "Configure authentication, password and security policies.",
    icon: ShieldCheck,
  },
  {
    title: "Notifications",
    description: "Configure email and platform notifications.",
    icon: Bell,
  },
  {
    title: "Developer",
    description: "Manage API keys, webhooks and developer settings.",
    icon: KeyRound,
  },
  {
    title: "Billing",
    description: "Manage subscription, payment methods and invoices.",
    icon: CreditCard,
    badge: "Pro",
  },
];

const recentMembers = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@acme.com",
    role: "Organization Admin",
    initials: "SJ",
  },
  {
    name: "Michael Chen",
    email: "michael.chen@acme.com",
    role: "Manager",
    initials: "MC",
  },
  {
    name: "David Wilson",
    email: "david.wilson@acme.com",
    role: "Developer",
    initials: "DW",
  },
];

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("General");

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [securityAlerts, setSecurityAlerts] =
    useState(true);

  const [weeklySummary, setWeeklySummary] =
    useState(false);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            Settings
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization, security, integrations and
            platform preferences.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 p-6">
        {/* Sidebar */}
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <div className="sticky top-6 space-y-1">
            {[
              {
                label: "General",
                icon: Settings2,
              },
              {
                label: "Organization",
                icon: Building2,
              },
              {
                label: "Members & Roles",
                icon: Users,
              },
              {
                label: "Security",
                icon: ShieldCheck,
              },
              {
                label: "Notifications",
                icon: Bell,
              },
              {
                label: "Developer",
                icon: KeyRound,
              },
              {
                label: "Billing",
                icon: CreditCard,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() =>
                    setActiveSection(item.label)
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* General */}
          {activeSection === "General" && (
            <div className="space-y-6">
              {/* Workspace */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <Globe2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Workspace settings
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Configure the basic settings for your
                        organization's workspace.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Workspace name
                      </label>

                      <Input defaultValue="Acme Corporation" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Workspace URL
                      </label>

                      <Input defaultValue="acme.platform.com" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Default timezone
                      </label>

                      <Input defaultValue="Asia/Kolkata" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Default language
                      </label>

                      <Input defaultValue="English (US)" />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button>Save changes</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-3">
                      <Palette className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Preferences
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Customize how your workspace behaves.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Email notifications
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Receive important workspace updates.
                        </p>
                      </div>

                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={
                          setEmailNotifications
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Security alerts
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Get notified about suspicious activity.
                        </p>
                      </div>

                      <Switch
                        checked={securityAlerts}
                        onCheckedChange={setSecurityAlerts}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Weekly summary
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Receive a weekly activity report.
                        </p>
                      </div>

                      <Switch
                        checked={weeklySummary}
                        onCheckedChange={setWeeklySummary}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick settings */}
              <Card>
                <CardContent className="p-6">
                  <div className="mb-5">
                    <h2 className="font-semibold">
                      Workspace management
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage other parts of your organization.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {settingSections.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.title}
                          className="group flex items-center gap-4 rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                        >
                          <div className="rounded-lg border bg-background p-2.5">
                            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>

                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Team */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold">
                        Team members
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Recently active members in your workspace.
                      </p>
                    </div>

                    <Button variant="outline">
                      Manage members
                    </Button>
                  </div>

                  <Separator className="my-5" />

                  <div className="space-y-4">
                    {recentMembers.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center gap-3"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {member.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>

                        <Badge variant="secondary">
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other settings placeholder */}
          {activeSection !== "General" && (
            <Card>
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-4 text-primary">
                  <Settings2 className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-semibold">
                  {activeSection}
                </h2>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  This settings module can be implemented as
                  a dedicated page or component.
                </p>

                <Button className="mt-5">
                  Configure {activeSection}
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;