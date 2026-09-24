import api from "./api";

/* ============================================================
   TYPES
   ============================================================ */

export interface Sidebar {
  id: string;
  displayName: string;
  displayOrder: number;
  sidebarDescription?: string | null;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SidebarPageResponse {
  content: Sidebar[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface SidebarSearchParams {
  page?: number;
  size?: number;

  search?: string;
  displayName?: string;

  active?: boolean;
  deleted?: boolean;
  includeDeleted?: boolean;

  createdFrom?: string;
  createdTo?: string;

  updatedFrom?: string;
  updatedTo?: string;

  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/* ============================================================
   GET SIDEBARS
   ============================================================ */

export async function getSidebars(
  params: SidebarSearchParams = {}
): Promise<SidebarPageResponse> {
  const response = await api.get<
    ApiResponse<SidebarPageResponse>
  >("/api/v1/sidebars/search", {
    params,
  });

  return response.data.data;
}

/* ============================================================
   DELETE SIDEBAR
   ============================================================ */

export async function deleteSidebar(
  id: string
) {
  const response = await api.delete<
    ApiResponse<void>
  >(`/api/v1/sidebars/${id}`);

  return response.data;
}

/* ============================================================
   RESTORE SIDEBAR
   ============================================================ */

export async function restoreSidebar(
  id: string
) {
  const response = await api.put<
    ApiResponse<void>
  >(`/api/v1/sidebars/${id}/restore`);

  return response.data;
}