const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Get the stored JWT token
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mesafacil_token');
}

/**
 * Store JWT token
 */
export function setToken(token: string): void {
  localStorage.setItem('mesafacil_token', token);
}

/**
 * Remove JWT token (logout)
 */
export function removeToken(): void {
  localStorage.removeItem('mesafacil_token');
}

/**
 * Typed HTTP client for the MesaFácil API.
 * Automatically includes JWT token and handles the standard response format.
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
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

    // Handle 401 — token expired or invalid
    if (response.status === 401) {
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
