import { Routes, Route } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import LoginPage from "@/pages/AuthPages/LoginPage";
import OrganizationsPage from "@/pages/TenantManagement/Organization/OrganizationsPage";
import AddOrganizationPage from "@/pages/TenantManagement/Organization/AddOrganizationPage";
import EditOrganizationPage from "@/pages/TenantManagement/Organization/EditOrganizationsPage";
import ViewOrganizationPage from "@/pages/TenantManagement/Organization/ViewOrganizationPage";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>} />
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/organizations" element={<OrganizationsPage/>} />
        <Route path="/organizations/new" element={<AddOrganizationPage/>} />
        <Route path="/organizations/:id/edit" element={<EditOrganizationPage/>} />
        <Route path="/organizations/:id" element={<ViewOrganizationPage/>} />
      </Route>
    </Routes>
  );
}