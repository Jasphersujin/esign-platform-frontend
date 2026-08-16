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

        
      </Route>
    </Routes>
  );
}