import { Loader2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  /** spinner 模式(默认)或骨架屏模式 */
  variant?: "spinner" | "skeleton"
  className?: string
}

/**
 * 页面级加载状态(Route Suspense fallback)
 * - spinner:居中加载动画
 * - skeleton:模拟页面骨架
 */
export function PageLoader({ variant = "spinner", className }: PageLoaderProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 p-6", className)} aria-label="页面加载中">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div
      className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-label="页面加载中"
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-caption">加载中…</p>
    </div>
  )
}
