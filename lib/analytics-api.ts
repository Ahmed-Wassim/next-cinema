const ANALYTICS_BASE_URL = "http://localhost:3003";

/**
 * Generic fetcher for the Go Analytics API.
 * Reads the token from localStorage and automatically injects it into the Authorization header.
 */
async function fetchFromAnalyticsAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const url = `${ANALYTICS_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Analytics API request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
       // Ignore JSON parsing errors for error bodies
    }
    throw new Error(`${errorMessage} (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch conversion metrics
 * GET /analytics/conversion
 */
export async function fetchConversion() {
  return fetchFromAnalyticsAPI<any>("/analytics/conversion");
}

/**
 * Fetch branches performance metrics
 * GET /analytics/branches
 */
export async function fetchBranches() {
  return fetchFromAnalyticsAPI<any>("/analytics/branches");
}

/**
 * Fetch top customers data
 * GET /analytics/customers
 */
export async function fetchCustomers() {
  return fetchFromAnalyticsAPI<any>("/analytics/customers");
}

/**
 * Fetch returning customers retention metrics
 * GET /analytics/returning
 */
export async function fetchReturning() {
  return fetchFromAnalyticsAPI<any>("/analytics/returning");
}

/**
 * Fetch trend data (revenue/bookings over time)
 * GET /analytics/trends
 */
export async function fetchTrends() {
  return fetchFromAnalyticsAPI<any>("/analytics/trends");
}
