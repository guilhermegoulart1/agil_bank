const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  remainingAttempts?: number;
  retryAfterMs?: number;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

export async function validateToken(token: string): Promise<{ valid: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  } catch {
    return { valid: false };
  }
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
