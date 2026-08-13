import { Shield, Wrench, Eye } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Role } from "@/types/auth"

const ROLE_STYLE: Record<string, { icon: React.ElementType; badge: string }> = {
  admin: { icon: Shield, badge: "border-transparent bg-primary/15 text-primary" },
  operator: { icon: Wrench, badge: "border-transparent bg-warning/15 text-warning" },
  viewer: { icon: Eye, badge: "border-transparent bg-muted text-muted-foreground" },
}

/** 角色徽章(Admin / Operator / Viewer) */
export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const style = ROLE_STYLE[role.name] ?? ROLE_STYLE.viewer
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        style.badge,
        className
      )}
    >
      <style.icon className="h-3 w-3" />
      {role.label}
    </span>
  )
}
