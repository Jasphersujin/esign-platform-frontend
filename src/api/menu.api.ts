import api from "./api";

/* ============================================================
   TYPES
============================================================ */

export interface Menu {
  id: string;
  menuName: string;
  sidebarId?: string | null;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
  active: boolean;
  deleted: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  version?: number;
}

export interface SidebarOption {
  id: string;
  displayName?: string;
  sidebarName?: string;
  name?: string;
  active?: boolean;
  deleted?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface MenuPageResponse {
  content: Menu[];
  page?: number;
  size?: number;
  number?: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
}

export interface MenuSearchParams {
  page?: number;
  size?: number;
  search?: string | null;
  active?: boolean | null;
  sidebarId?: string | null;
  standalone?: boolean | null;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface CreateMenuRequest {
  menuName: string;
  sidebarId?: string | null;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
}

export interface UpdateMenuRequest {
  menuName: string;
  sidebarId?: string | null;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
}

/* ============================================================
   HELPERS
============================================================ */

function unwrap<T>(response: {
  data: ApiResponse<T> | T;
}): T {
  const value = response.data;

  if (
    value &&
    typeof value === "object" &&
    "data" in value
  ) {
    return (value as ApiResponse<T>).data;
  }

  return value as T;
}

/* ============================================================
   CREATE
============================================================ */

export async function createMenu(
  payload: CreateMenuRequest
): Promise<Menu> {
  const response = await api.post<ApiResponse<Menu>>(
    "/api/v1/menus",
    payload
  );

  return response.data.data;
}

/* ============================================================
   GET BY ID
============================================================ */

export async function getMenuById(
  id: string
): Promise<Menu> {
  const response = await api.get<ApiResponse<Menu>>(
    `/api/v1/menus/${id}`
  );

  return response.data.data;
}

/* ============================================================
   UPDATE
============================================================ */

export async function updateMenu(
  id: string,
  payload: UpdateMenuRequest
): Promise<Menu> {
  const response = await api.put<ApiResponse<Menu>>(
    `/api/v1/menus/${id}`,
    payload
  );

  return response.data.data;
}

/* ============================================================
   SEARCH
============================================================ */

export async function searchMenus(
  params: MenuSearchParams = {}
): Promise<MenuPageResponse> {
  const response = await api.post<
    ApiResponse<MenuPageResponse>
  >(
    "/api/v1/menus/search",
    {
      search: params.search?.trim() || null,

      active:
        params.active === undefined
          ? true
          : params.active,

      sidebarId:
        params.sidebarId || null,

      standalone:
        params.standalone ?? null,

      page: params.page ?? 0,

      size: params.size ?? 20,

      sortBy:
        params.sortBy ?? "displayOrder",

      sortDirection:
        params.sortDirection ?? "ASC",
    }
  );

  return response.data.data;
}

/* ============================================================
   GET MENUS BY SIDEBAR
============================================================ */

export async function getMenusBySidebarId(
  sidebarId: string
): Promise<Menu[]> {
  const response = await api.get<ApiResponse<Menu[]>>(
    `/api/v1/menus/sidebar/${sidebarId}`
  );

  return response.data.data;
}

/* ============================================================
   ACTIVATE
============================================================ */

export async function activateMenu(
  id: string
) {
  const response = await api.put<ApiResponse<void>>(
    `/api/v1/menus/${id}/activate`
  );

  return response.data;
}

/* ============================================================
   DEACTIVATE
============================================================ */

export async function deactivateMenu(
  id: string
) {
  const response = await api.put<ApiResponse<void>>(
    `/api/v1/menus/${id}/deactivate`
  );

  return response.data;
}

/* ============================================================
   DELETE
============================================================ */

export async function deleteMenu(
  id: string
) {
  const response = await api.delete<ApiResponse<void>>(
    `/api/v1/menus/${id}`
  );

  return response.data;
}