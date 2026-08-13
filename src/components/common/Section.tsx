import * as React from "react"

import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** 区块标题(使用 text-heading 层级) */
  title?: string
  /** 区块说明(辅助文字) */
  description?: string
  /** 区块内是否包含页头 */
  header?: boolean
}

/**
 * 区块容器 — 统一 Section 垂直间距(--space-section)
 * 用法:<Section title="标题" description="说明">内容</Section>
 */
export function Section({
  title,
  description,
  header = true,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("py-[var(--space-section)]", className)}
      {...props}
    >
      {header && (title || description) && (
        <div className="mb-[var(--space-card)] max-w-2xl">
          {title && <h2 className="text-heading">{title}</h2>}
          {description && (
            <p className="text-body-sm mt-2">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
