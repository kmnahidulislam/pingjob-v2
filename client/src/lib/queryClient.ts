import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { resolveApiUrl } from "./apiConfig";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const resolvedUrl = resolveApiUrl(url);
  
  const res = await fetch(resolvedUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(!resolvedUrl.startsWith('http') && { "X-Requested-With": "XMLHttpRequest" })
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from entire queryKey array
    let url = queryKey[0] as string;
    
    // Append additional segments as path components
    for (let i = 1; i < queryKey.length; i++) {
      const segment = queryKey[i];
      if (typeof segment === 'string' || typeof segment === 'number') {
        url += `/${segment}`;
      } else if (typeof segment === 'object' && segment !== null) {
        // Serialize object as query string
        const params = new URLSearchParams();
        Object.entries(segment).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
    }
    
    const resolvedUrl = resolveApiUrl(url);
    
    const res = await fetch(resolvedUrl, {
      credentials: "include",
      headers: {
        ...(!resolvedUrl.startsWith('http') && { "X-Requested-With": "XMLHttpRequest" })
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
