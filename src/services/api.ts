import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import {
  User,
  Centre,
  CentreStatistiques,
  Planning,
  Presence,
  SeanceLecture,
  Conversation,
  Message,
  StatistiquesGlobal,
  LoginResponse,
  PaginatedResponse,
  PlanningFilters,
} from "@/types";

// ============================================================
// Instance Axios
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ---- Intercepteur requête : injection JWT ----
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Intercepteur réponse : redirection 401 ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("role");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Auth
// ============================================================

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/token/", { email, password });
  localStorage.setItem("token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  if (data.user?.role) {
    localStorage.setItem("role", data.user.role);
  }
  return data;
}

// ============================================================
// Users
// ============================================================

export async function getUsers(params?: { role?: string; is_active?: boolean }): Promise<User[]> {
  const { data } = await api.get<PaginatedResponse<User>>("/api/users/", { params });
  return data.results;
}

export async function createUser(userData: Partial<User> & { password?: string }): Promise<User> {
  const { data } = await api.post<User>("/api/users/", userData);
  return data;
}

export async function deactivateUser(id: number): Promise<User> {
  const { data } = await api.patch<User>(`/api/users/${id}/`, { is_active: false });
  return data;
}

export async function activateUser(id: number): Promise<User> {
  const { data } = await api.patch<User>(`/api/users/${id}/`, { is_active: true });
  return data;
}

export async function resetPassword(id: number, newPassword: string): Promise<void> {
  await api.post(`/api/users/${id}/reset-password/`, { password: newPassword });
}

// ============================================================
// Centres
// ============================================================

export async function getCentres(): Promise<Centre[]> {
  const { data } = await api.get<PaginatedResponse<Centre>>("/api/centres/");
  return data.results;
}

export async function createCentre(centreData: Partial<Centre>): Promise<Centre> {
  const { data } = await api.post<Centre>("/api/centres/", centreData);
  return data;
}

export async function updateCentre(id: number, centreData: Partial<Centre>): Promise<Centre> {
  const { data } = await api.put<Centre>(`/api/centres/${id}/`, centreData);
  return data;
}

export async function deleteCentre(id: number): Promise<void> {
  await api.delete(`/api/centres/${id}/`);
}

export async function getCentreStatistiques(id: number): Promise<CentreStatistiques> {
  const { data } = await api.get<CentreStatistiques>(`/api/centres/${id}/statistiques/`);
  return data;
}

// ============================================================
// Planning
// ============================================================

export async function getPlanning(filters?: PlanningFilters): Promise<Planning[]> {
  const { data } = await api.get<PaginatedResponse<Planning>>("/api/planning/", { params: filters });
  return data.results;
}

export async function createPlanning(planningData: Partial<Planning>): Promise<Planning> {
  const { data } = await api.post<Planning>("/api/planning/", planningData);
  return data;
}

export async function updatePlanning(id: number, planningData: Partial<Planning>): Promise<Planning> {
  const { data } = await api.patch<Planning>(`/api/planning/${id}/`, planningData);
  return data;
}

export async function deletePlanning(id: number): Promise<void> {
  await api.delete(`/api/planning/${id}/`);
}

// ============================================================
// Présences
// ============================================================

export async function getPresences(creneauId: number): Promise<Presence[]> {
  const { data } = await api.get<PaginatedResponse<Presence>>(`/api/presences/`, {
    params: { creneau_id: creneauId },
  });
  return data.results;
}

export async function postPresence(presenceData: Partial<Presence>): Promise<Presence> {
  const { data } = await api.post<Presence>("/api/presences/", presenceData);
  return data;
}

// ============================================================
// Lectures (séances)
// ============================================================

export async function getLectures(apprenantId: number): Promise<SeanceLecture[]> {
  const { data } = await api.get<PaginatedResponse<SeanceLecture>>(`/api/lectures/`, {
    params: { apprenant_id: apprenantId },
  });
  return data.results;
}

export async function postLecture(lectureData: Partial<SeanceLecture>): Promise<SeanceLecture> {
  const { data } = await api.post<SeanceLecture>("/api/lectures/", lectureData);
  return data;
}

// ============================================================
// Messagerie
// ============================================================

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<PaginatedResponse<Conversation>>("/api/conversations/");
  return data.results;
}

export async function getMessages(convId: number): Promise<Message[]> {
  const { data } = await api.get<PaginatedResponse<Message>>(`/api/conversations/${convId}/messages/`);
  return data.results;
}

export async function sendMessage(convId: number, contenu: string): Promise<Message> {
  const { data } = await api.post<Message>(`/api/conversations/${convId}/messages/`, { contenu });
  return data;
}

// ============================================================
// Statistiques
// ============================================================

export async function getStatistiquesGlobal(): Promise<any> {
  const { data } = await api.get("/api/statistiques/global/");
  return data;
}

export async function getStatistiquesEnseignant(id: number): Promise<any> {
  const { data } = await api.get(`/api/statistiques/enseignant/${id}/`);
  return data;
}

export async function getStatistiquesCentre(id: number): Promise<any> {
  const { data } = await api.get(`/api/statistiques/centre/${id}/`);
  return data;
}

export async function getStatistiquesApprenant(id: number): Promise<any> {
  const { data } = await api.get(`/api/statistiques/apprenant/${id}/`);
  return data;
}

// ============================================================
// Export Excel
// ============================================================

export async function exportExcel(): Promise<Blob> {
  const { data } = await api.get("/api/statistiques/export-excel/", { responseType: "blob" });
  return data;
}

export async function exportPdf(): Promise<Blob> {
  const { data } = await api.get("/api/statistiques/export-pdf/", { responseType: "blob" });
  return data;
}

// ---- Export de l'instance pour usage direct si nécessaire ----
export default api;
