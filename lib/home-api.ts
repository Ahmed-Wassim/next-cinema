type HomeApiResponse<T> = {
  data: T;
  status: number;
};

type HomeApiErrorResponse = {
  message?: string;
  [key: string]: unknown;
};

class HomeApiError extends Error {
  response: {
    data: HomeApiErrorResponse;
    status: number;
  };

  constructor(message: string, status: number, data: HomeApiErrorResponse) {
    super(message);
    this.name = "HomeApiError";
    this.response = { data, status };
  }
}

const HOME_API_BASE_URL =
  process.env.NEXT_PUBLIC_TENANT_URL ?? "http://foo.cinema.test/api";

function buildHomeApiUrl(path: string) {
  const normalizedBaseUrl = HOME_API_BASE_URL.endsWith("/")
    ? HOME_API_BASE_URL
    : `${HOME_API_BASE_URL}/`;
  const normalizedPath = path.replace(/^\/+/, "");

  return new URL(normalizedPath, normalizedBaseUrl).toString();
}

async function parseResponseBody<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return (text ? ({ message: text } as T) : ({} as T));
}

async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildHomeApiUrl(path), {
    cache: "no-store",
    ...init,
    headers,
  });

  const data = await parseResponseBody<T | HomeApiErrorResponse>(response);

  if (!response.ok) {
    const errorData =
      data && typeof data === "object" ? (data as HomeApiErrorResponse) : {};
    const message =
      errorData.message ??
      `Request failed with status ${response.status}`;

    throw new HomeApiError(message, response.status, errorData);
  }

  return {
    data: data as T,
    status: response.status,
  } satisfies HomeApiResponse<T>;
}

export const homeApi = {
  get<T>(path: string) {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};
