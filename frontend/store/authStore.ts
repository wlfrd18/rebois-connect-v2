import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  user_id: string;
  exp: number;
}

interface User {
  id: string;
  email: string;
  username: string;
  role: "volontaire" | "mecene" | "structure" | "admin";
  kyc_status: string;
  first_name: string;
  last_name: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false,

  setTokens: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
