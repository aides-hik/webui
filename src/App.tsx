import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/common/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppRouter } from "@/router"
import { useAuthStore } from "@/stores/authStore"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  const init = useAuthStore((s) => s.init)

  /* 启动时恢复持久化会话(经 authApi.me 校验) */
  useEffect(() => {
    void init()
  }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider delayDuration={200}>
          <AppRouter />
          <Toaster richColors position="bottom-right" closeButton />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
