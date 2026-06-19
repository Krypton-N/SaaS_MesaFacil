const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

const TOKEN_KEY = 'mesafacil_token';
const REFRESH_KEY = 'mesafacil_refresh_token';

/**
 * Get the stored access JWT token
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

/**
 * Store the access JWT token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Store both the access token and the refresh token (used on login/register).
 */
export function setTokens(token: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

/**
 * Remove all auth tokens (logout)
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/**
 * Intenta renovar el access token usando el refresh token almacenado.
 * Devuelve el nuevo access token, o null si no se pudo renovar.
 * Se memoiza la promesa en curso para evitar múltiples refresh simultáneos.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data: ApiResponse<{ token: string; refreshToken: string }> = await response.json();
      if (response.ok && data.success && data.data) {
        setTokens(data.data.token, data.data.refreshToken);
        return data.data.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Typed HTTP client for the MesaFácil API.
 * Automatically includes JWT token and handles the standard response format.
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 — el access token expiró o es inválido
    if (response.status === 401) {
      // Intentar renovar con el refresh token (una sola vez por petición)
      if (!isRetry && endpoint !== '/auth/refresh') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return request<T>(endpoint, options, true);
        }
      }

      // Sin refresh válido → cerrar sesión
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, data: null, error: 'Sesión expirada' };
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (err) {
    console.error('API request error:', err);
    return { success: false, data: null, error: 'Error de conexión con el servidor' };
  }
}

// ---- Convenience methods ----

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
