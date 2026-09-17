import { Routes, Route } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import LoginPage from "@/pages/AuthPages/LoginPage";
import OrganizationsPage from "@/pages/TenantManagement/Organization/OrganizationsPage";
import AddOrganizationPage from "@/pages/TenantManagement/Organization/AddOrganizationPage";
import EditOrganizationPage from "@/pages/TenantManagement/Organization/EditOrganizationsPage";
import ViewOrganizationPage from "@/pages/TenantManagement/Organization/ViewOrganizationPage";
import DepartmentsPage from "@/pages/TenantManagement/Department/DepartmentsPage";
import AddDepartmentPage from "@/pages/TenantManagement/Department/AddDepartmentPage";
import EditDepartmentPage from "@/pages/TenantManagement/Department/EditDepartmentPage";
import ViewDepartmentPage from "@/pages/TenantManagement/Department/ViewDepartmentPage";
import EmployeesPage from "@/pages/TenantManagement/Employees/EmployeesPage";
import AddEmployeePage from "@/pages/TenantManagement/Employees/AddEmployeePage";
import EditEmployeePage from "@/pages/TenantManagement/Employees/EditEmployeePage";
import ViewEmployeePage from "@/pages/TenantManagement/Employees/ViewEmployeePage";
import SettingsPage from "@/pages/Settings/SettingsPage";
import AuditTrailPage from "@/pages/AuditTrails/AuditTrailPage";
import RolesPage from "@/pages/AccessControl/Roles/RolesPage";
import AddRolesPage from "@/pages/AccessControl/Roles/AddRolesPage";
import ViewRolesPage from "@/pages/AccessControl/Roles/ViewRolesPage";
import EditRolesPage from "@/pages/AccessControl/Roles/EditRolesPage";
import AddSidebarPage from "@/pages/systemconfiguration/sidebar/AddSidebarPage";
import SidebarPage from "@/pages/systemconfiguration/sidebar/SidebarPage";
import EditSidebarPage from "@/pages/systemconfiguration/sidebar/EditSidebarPage";
import ViewSidebarPage from "@/pages/systemconfiguration/sidebar/ViewSidebarPage";
import MenusPage from "@/pages/systemconfiguration/menu/MenusPage";
import ViewMenuPage from "@/pages/systemconfiguration/menu/ViewMenuPage";
import AddMenuPage from "@/pages/systemconfiguration/menu/AddMenuPage";
import EditMenuPage from "@/pages/systemconfiguration/menu/EditMenuPage";
import ScreensPage from "@/pages/systemconfiguration/screens/ScreensPage";
import AddScreenPage from "@/pages/systemconfiguration/screens/AddScreenPage";
import EditScreenPage from "@/pages/systemconfiguration/screens/EditScreenPage";
import ViewScreenPage from "@/pages/systemconfiguration/screens/ViewScreenPage";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>} />
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />

        {/* Organization */}
        <Route path="/organizations" element={<OrganizationsPage/>} />
        <Route path="/organizations/new" element={<AddOrganizationPage/>} />
        <Route path="/organizations/:id/edit" element={<EditOrganizationPage/>} />
        <Route path="/organizations/:id" element={<ViewOrganizationPage/>} />

        {/* Department */}
        <Route path="/departments" element={<DepartmentsPage/>} />
        <Route path="/departments/new" element={<AddDepartmentPage/>} />
        <Route path="/departments/:id/edit" element={<EditDepartmentPage/>} />
        <Route path="/departments/:id" element={<ViewDepartmentPage/>} />

        {/* Employees */}
        <Route path="/employees" element={<EmployeesPage/>} />
        <Route path="/employees/new" element={<AddEmployeePage/>} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage/>} />
        <Route path="/employees/:id" element={<ViewEmployeePage/>} />

        {/* Roles */}

        <Route path="/roles" element={<RolesPage />}/>
        <Route path="/roles/new" element={<AddRolesPage />}/>
        <Route path="/roles/:id" element={<ViewRolesPage />} />
        <Route path="/roles/:id/edit" element={<EditRolesPage />}/>

        {/* System Configuration */}

        <Route path="/sidebars" element={<SidebarPage/>} />
        <Route path="/sidebars/new" element={<AddSidebarPage/>} />
        <Route path="/sidebar/:id/edit" element={<EditSidebarPage/>} />
        <Route path="/sidebar/:id" element={<ViewSidebarPage/>} />

        {/* Menu Management */}
        <Route path="/menus" element={<MenusPage/>} />
        <Route path="/menus/:id" element={<ViewMenuPage/>} />
        <Route path="/menus/new" element={<AddMenuPage/>} />
        <Route path="/menus/:id/edit" element={<EditMenuPage/>} />

        {/* Screen Management */}
        <Route path="/screens" element={<ScreensPage/>} />
        <Route path="/screens/new" element={<AddScreenPage/>} />
        <Route path="/screens/:id/edit" element={<EditScreenPage/>} />
        <Route path="/screens/:id" element={<ViewScreenPage/>} />
        
        {/* Audit Trail */}
        <Route path="/audit-logs" element={<AuditTrailPage/>} />

        {/* Settings */}

        <Route path="/settings" element={<SettingsPage/>} />
      </Route>
    </Routes>
  );
}