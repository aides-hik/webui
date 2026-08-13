import * as React from "react"

import { useInView } from "@/hooks/useInView"
import { cn } from "@/lib/utils"

type Animation = "fade-up" | "fade-down" | "fade-in" | "scale-in"

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 入场动画类型 */
  animation?: Animation
  /** 动画延迟(ms),用于 stagger 编排 */
  delay?: number
  /** 动画时长(ms),默认使用 --duration-base */
  duration?: number
  /** 进入视口触发阈值(0-1) */
  threshold?: number
}

/**
 * 微动画容器 — 元素进入视口时播放入场动画
 * 基于 design-tokens 的缓动与时长 Token,滚动触发,只播放一次
 */
export function AnimatedContainer({
  animation = "fade-up",
  delay = 0,
  duration,
  threshold = 0.15,
  className,
  children,
  style,
  ...props
}: AnimatedContainerProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold })

  return (
    <div
      ref={ref}
      className={cn(`anim-${animation}`, className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: duration ? `${duration}ms` : undefined,
        animationPlayState: inView ? "running" : "paused",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
