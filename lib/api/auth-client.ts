import type { AuthPayload, SessionUser } from "@/types/auth";

export interface AuthResponse {
  ok: boolean;
  message?: string;
  session?: SessionUser;
}

const toJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T;
  return payload;
};

export const loginUser = async (payload: AuthPayload): Promise<AuthResponse> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return toJson<AuthResponse>(response);
};

export const registerUser = async (payload: AuthPayload): Promise<AuthResponse> => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return toJson<AuthResponse>(response);
};

export const logoutUser = async (): Promise<AuthResponse> => {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });
  return toJson<AuthResponse>(response);
};
