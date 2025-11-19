"use client";

const TOKEN_KEY = "vc_access_token";

type LoginResponse = {
  access?: string;
  token?: string;
  [k: string]: any;
};

export async function login(email: string, password: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  // Ensure trailing slash to match Django URL patterns
  const url = base.replace(/\/$/, "") + "/auth/login/";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    // try to parse a helpful message
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.detail || j.message || JSON.stringify(j);
    } catch (e) {
      /* ignore */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const data: LoginResponse = await res.json();
  const access = data.access || data.token || data.access_token || data.accessToken;
  if (!access) throw new Error("No access token returned from server");
  setToken(access);
  return data;
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function decodeToken(token?: string): any | null {
  if (!token) token = getToken() || undefined;
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = decodeURIComponent(Array.prototype.map.call(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), function(c: any) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
