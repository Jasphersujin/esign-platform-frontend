import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthData,
  getUser,
  isAuthenticated,
  setAuthData,
} from "@/utils/auth";

import { loginApi } from "@/api/auth.api";

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState(
    () => getUser()
  );

  const [authenticated, setAuthenticated] =
    useState(() => isAuthenticated());

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {
    const response = await loginApi({
      email,
      password,
    });

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Login failed."
      );
    }

    const authData = response.data;

    // Store token + user data
    setAuthData(authData);

    // Update authentication state
    setUser(authData.user);
    setAuthenticated(true);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    clearAuthData();

    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: authenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}