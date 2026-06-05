export const API_BASE_URL = "http://localhost:5099";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse standard ApiResponse error
    try {
      const errorData = await response.json();
      return errorData as ApiResponse<T>;
    } catch {
      return {
        success: false,
        message: `HTTP Error: ${response.status} ${response.statusText}`,
        data: null as any,
        errors: [response.statusText]
      };
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
      return {
          success: true,
          message: "Success",
          data: null as any,
          errors: null
      };
  }

  return await response.json() as ApiResponse<T>;
}
