import { Routes, Route } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import LoginPage from "@/pages/AuthPages/LoginPage";
import OrganizationsPage from "@/pages/TenantManagement/Organization/OrganizationsPage";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>} />
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/organizations" element={<OrganizationsPage/>} />
      </Route>
    </Routes>
  );
}