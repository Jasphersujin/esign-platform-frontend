import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as LucideIcons from "lucide-react";
import { ArrowLeft, Check, ChevronDown, Loader2, Save, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import api from "@/api/api";
const ICON_NAMES = [
  "LayoutDashboard","Home","Users","User","Settings","Shield","ShieldCheck","Menu",
  "FileText","Folder","FolderOpen","Database","BarChart3","PieChart","LineChart",
  "Activity","Bell","Calendar","Clock","Search","Building2","Factory","Package",
  "Boxes","ShoppingCart","CreditCard","Wallet","Briefcase","ClipboardList",
  "CheckCircle2","AlertCircle","Info","HelpCircle","Globe","Lock","Key","Mail",
  "MessageSquare","Upload","Download","Eye","Pencil","Trash2","Plus","Layers",
  "Grid2X2","Table2"
] as const;

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? fallback;
}

function unwrap<T>(response: { data: T | { data: T } }): T {
  const value = response.data as T | { data: T };
  if (value && typeof value === "object" && "data" in (value as object)) return (value as {data:T}).data;
  return value as T;
}

function IconPreview({ name }: { name: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{className?: string}>>)[name] ?? LucideIcons.Menu;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-primary/5 text-primary">
      <Icon className="h-5 w-5" />
    </div>
  );
}

async function searchSidebars(search: string) {
  const response = await api.post("/api/v1/sidebars/search", {
    search: search.trim() || null,
    active: true,
    page: 0,
    size: 100,
    sortBy: "displayOrder",
    sortDirection: "ASC",
  });
  const data = unwrap<any>(response);
  return Array.isArray(data) ? data : data?.content ?? [];
}


const menuSchema = z.object({
  menuName: z.string().trim().min(2, "Menu name must be at least 2 characters").max(150, "Menu name cannot exceed 150 characters"),
  sidebarId: z.string().optional(),
  icon: z.string().trim().min(1, "Please select an icon").max(150, "Icon cannot exceed 150 characters"),
  displayOrder: z.coerce.number().int("Display order must be a whole number").min(0, "Display order cannot be negative"),
  description: z.string().max(5000, "Description cannot exceed 5000 characters"),
});

type FormValues = z.infer<typeof menuSchema>;

const AddMenuPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [iconOpen, setIconOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebars, setSidebars] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: { menuName: "", sidebarId: "", icon: "Menu", displayOrder: 0, description: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const selectedIcon = form.watch("icon");
  const selectedSidebarId = form.watch("sidebarId");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setSidebars(await searchSidebars(sidebarSearch));
      } catch {
        setSidebars([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [sidebarSearch]);

  const selectedSidebar = useMemo(
    () => sidebars.find(s => s.id === selectedSidebarId),
    [sidebars, selectedSidebarId]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      setError("");
      await api.post("/api/v1/menus", {
        menuName: values.menuName.trim(),
        sidebarId: values.sidebarId || null,
        description: values.description.trim() || null,
        icon: values.icon.trim(),
        displayOrder: values.displayOrder,
      });
      navigate("/menus");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to create menu."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full max-w-5xl p-4 sm:p-6">
        <Button type="button" variant="ghost" className="-ml-2 mb-3" onClick={() => navigate("/menus")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menus
        </Button>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Add Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a standalone menu or place it inside a sidebar.</p>
        </div>

        {error && <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Information</CardTitle>
              <CardDescription>Configure the menu label, hierarchy, icon and ordering.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Controller name="menuName" control={form.control} render={({field, fieldState}) => (
                  <Field><FieldLabel>Menu Name *</FieldLabel><Input {...field} placeholder="Dashboard" disabled={submitting}/><FieldError>{fieldState.error?.message}</FieldError></Field>
                )}/>
                <Controller name="displayOrder" control={form.control} render={({field, fieldState}) => (
                  <Field><FieldLabel>Display Order *</FieldLabel><Input type="number" min={0} {...field} disabled={submitting}/><FieldError>{fieldState.error?.message}</FieldError></Field>
                )}/>
              </div>

              <Controller name="sidebarId" control={form.control} render={({field}) => (
                <Field>
                  <FieldLabel>Sidebar</FieldLabel>
                  <Popover open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" className="w-full justify-between">
                        {selectedSidebar ? (selectedSidebar.displayName ?? selectedSidebar.sidebarName ?? selectedSidebar.name) : "Standalone menu"}
                        <ChevronDown className="h-4 w-4 opacity-50"/>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search sidebar..." value={sidebarSearch} onValueChange={setSidebarSearch}/>
                        <CommandList>
                          <CommandEmpty>No active sidebars found.</CommandEmpty>
                          <CommandItem value="standalone" onSelect={() => {field.onChange(""); setSidebarOpen(false);}}>
                            <Check className={`mr-2 h-4 w-4 ${!field.value ? "opacity-100" : "opacity-0"}`}/> Standalone menu
                          </CommandItem>
                          {sidebars.map(s => {
                            const label = s.displayName ?? s.sidebarName ?? s.name ?? s.id;
                            return <CommandItem key={s.id} value={`${label} ${s.id}`} onSelect={() => {field.onChange(s.id); setSidebarOpen(false);}}>
                              <Check className={`mr-2 h-4 w-4 ${field.value === s.id ? "opacity-100" : "opacity-0"}`}/>{label}
                            </CommandItem>
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Leave this as Standalone menu when sidebarId should be null.</p>
                </Field>
              )}/>

              <div className="space-y-2">
                <FieldLabel>Icon *</FieldLabel>
                <Popover open={iconOpen} onOpenChange={setIconOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="h-auto w-full justify-between p-2">
                      <span className="flex items-center gap-3"><IconPreview name={selectedIcon}/><span>{selectedIcon}</span></span>
                      <ChevronDown className="h-4 w-4 opacity-50"/>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search icon..."/>
                      <CommandList>
                        <CommandEmpty>No icon found.</CommandEmpty>
                        {ICON_NAMES.map(name => <CommandItem key={name} value={name} onSelect={() => {form.setValue("icon", name, {shouldValidate: true}); setIconOpen(false);}}>
                          <IconPreview name={name}/><span className="ml-2">{name}</span>
                        </CommandItem>)}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.icon && <p className="text-sm text-destructive">{form.formState.errors.icon.message}</p>}
              </div>

              <Controller name="description" control={form.control} render={({field, fieldState}) => (
                <Field><FieldLabel>Description</FieldLabel><Textarea {...field} placeholder="Describe the purpose of this menu..." rows={5} disabled={submitting}/><FieldError>{fieldState.error?.message}</FieldError></Field>
              )}/>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/menus")} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
              Create Menu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMenuPage;