import * as React from "react"

import { cn } from "@/lib/utils"

type PageContainerSize = "narrow" | "default" | "wide"

const SIZE_CLASSES: Record<PageContainerSize, string> = {
  narrow: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-[1400px]",
}

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 页面宽度:narrow 约 896px / default 约 1152px / wide 约 1400px */
  size?: PageContainerSize
}

/**
 * 页面容器 — 统一页面水平 padding(--space-page)与最大宽度
 * 所有页面顶层必须使用本组件包裹
 */
export function PageContainer({
  size = "default",
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-[var(--space-page)]",
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
}
