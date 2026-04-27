"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Treat data as fresh for 30s — avoids the default of 0 that
            // refetches on every mount/focus and hammers the backend.
            staleTime: 30_000,
            // Don't refetch automatically when the user tabs back in. Mutations
            // already invalidate the relevant keys explicitly.
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
