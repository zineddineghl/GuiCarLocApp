import { API_URL } from "../constants/api";

export type UserRole = "owner" | "renter" | "both";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_admin: number;
  banned: boolean;
  email_verified: number;
  created_at: string;
  avatar?: string;
  id_status?: "none" | "pending" | "verified" | "rejected";
  id_rejection_reason?: string | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data as T;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<{ requires_verification: true; userId: number }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyEmail: (userId: number, code: string) =>
    request<{ token: string; user: User }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ userId, code }),
    }),

  resendVerify: (userId: number) =>
    request<{ ok: true }>("/auth/resend-verify", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  login: (email: string, password: string) =>
    request<
      { token: string; user: User } | { requires_2fa: true; userId: number }
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verify2fa: (userId: number, code: string) =>
    request<{ token: string; user: User }>("/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ userId, code }),
    }),

  forgotPassword: (email: string) =>
    request<{ ok: true }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  me: (token: string) =>
    request<{ user: User }>("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
};
