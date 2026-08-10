import api from "@/api/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export const loginApi = async (
  data: LoginRequest
) => {
  const response = await api.post(
    "/api/v1/login",
    data
  );

  return response.data;
};