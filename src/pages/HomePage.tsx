import { Link } from "react-router-dom"
import { Boxes, Layers, LayoutDashboard, Palette, Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const FEATURES = [
  {
    icon: Boxes,
    title: "组件化架构",
    description: "ui/ 基础组件 + common/ 业务组件分层,多文件拆分,保持可维护。",
  },
  {
    icon: Palette,
    title: "主题系统",
    description: "全局 CSS 变量驱动,支持亮色 / 暗色主题,语义化颜色。",
  },
  {
    icon: Layers,
    title: "Hash Router",
    description: "基于 react-router-dom 的 Hash 路由,适合纯静态部署。",
  },
  {
    icon: Rocket,
    title: "Vite + React 18",
    description: "现代构建工具链,TypeScript 严格模式,路径别名 @/。",
  },
]

/**
 * 首页占位页
 * 后续业务页面在此基础之上扩展
 */
export function HomePage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary" className="px-3 py-1">
          项目骨架已就绪
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          现代 Web 平台脚手架
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          React 18 · TypeScript · Vite · Tailwind CSS 3 · shadcn/ui
          · Hash Router · lucide-react
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/dashboard">
              <LayoutDashboard />
              进入控制台
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/design-system">设计系统</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-10" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
