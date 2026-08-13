import * as React from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 玻璃卡片 — visionOS 风格毛玻璃面板
 * 半透明背景 + backdrop-blur + 细亮边框 + 柔和阴影 + 大圆角
 * 建议放置在渐变/图片背景之上以体现玻璃质感
 */
export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <Card
      className={cn(
        "border-glass bg-glass shadow-soft backdrop-blur-glass",
        className
      )}
      {...props}
    />
  )
}
