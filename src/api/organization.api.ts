import api from "./api";

export async function updateOrganization(
  id: string,
  formData: FormData
) {
  const response = await api.put(
    `/api/v1/organizations/${id}`,
    formData
  );

  return response.data;
}