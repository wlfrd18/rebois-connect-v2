import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("access_token", res.data.access);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login:    (email: string, password: string) =>
    api.post("/auth/login/", { email, password }),
  register: (data: Record<string, string>) =>
    api.post("/auth/register/", data),
  logout:   (refresh: string) =>
    api.post("/auth/logout/", { refresh }),
  me:       () => api.get("/auth/me/"),
};

export const proposalsApi = {
  list:        (params?: Record<string, string>) =>
    api.get("/proposals/", { params }),
  create:      (data: FormData) =>
    api.post("/proposals/", data, { headers: { "Content-Type": "multipart/form-data" } }),
  get:         (id: string) => api.get(`/proposals/${id}/`),
  preValidate: (id: string, note: string) =>
    api.post(`/proposals/${id}/pre_validate/`, { note }),
  reject:      (id: string, reason: string) =>
    api.post(`/proposals/${id}/reject/`, { reason }),
  approve:     (id: string) => api.post(`/proposals/${id}/approve/`),
};

export const certificatesApi = {
  list:   () => api.get("/certificates/"),
  verify: (id: string) => api.get(`/certificates/${id}/verify/`),
};

export const contractsApi = {
  list: () => api.get("/contracts/"),
  sign: (id: string) => api.post(`/contracts/${id}/sign/`),
};

export const milestonesApi = {
  validate: (id: string) => api.post(`/milestones/${id}/validate/`),
  reject:   (id: string, reason: string) =>
    api.post(`/milestones/${id}/reject/`, { reason }),
};
