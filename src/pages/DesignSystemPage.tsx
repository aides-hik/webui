import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Bell,
  Check,
  ChevronDown,
  Copy,
  Gem,
  Github,
  Loader2,
  Mail,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
} from "lucide-react"

import { AnimatedContainer } from "@/components/common/AnimatedContainer"
import { GlassCard } from "@/components/common/GlassCard"
import { PageContainer } from "@/components/common/PageContainer"
import { Section } from "@/components/common/Section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/* ---------- 颜色展示 ---------- */

const COLOR_TOKENS: { name: string; variable: string; className: string; text?: string }[] = [
  { name: "Background", variable: "--background", className: "bg-background" },
  { name: "Foreground", variable: "--foreground", className: "bg-foreground", text: "text-background" },
  { name: "Primary", variable: "--primary", className: "bg-primary", text: "text-primary-foreground" },
  { name: "Secondary", variable: "--secondary", className: "bg-secondary", text: "text-secondary-foreground" },
  { name: "Accent", variable: "--accent", className: "bg-accent", text: "text-accent-foreground" },
  { name: "Muted", variable: "--muted", className: "bg-muted", text: "text-muted-foreground" },
  { name: "Card", variable: "--card", className: "bg-card border", text: "text-card-foreground" },
  { name: "Border", variable: "--border", className: "bg-border", text: "text-foreground" },
  { name: "Destructive", variable: "--destructive", className: "bg-destructive", text: "text-destructive-foreground" },
]

function ColorsTab() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-body-sm mb-4">
          全部颜色由 <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">design-tokens.css</code>{" "}
          的 HSL 语义变量驱动,亮/暗主题自动切换,禁止在组件中直接写色值。
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_TOKENS.map((token) => (
            <div
              key={token.name}
              className="overflow-hidden rounded-lg border shadow-soft-sm transition-shadow hover:shadow-soft"
            >
              <div className={cn("flex h-24 items-end p-3", token.className, token.text)}>
                <span className="text-sm font-semibold">{token.name}</span>
              </div>
              <div className="bg-card px-3 py-2">
                <p className="font-mono text-xs text-muted-foreground">{token.variable}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        <GlassCard className="p-6">
          <p className="text-label text-muted-foreground">品牌渐变</p>
          <div className="bg-gradient-brand mt-3 h-20 rounded-lg" />
          <p className="font-mono mt-2 text-xs text-muted-foreground">--gradient-brand</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-label text-muted-foreground">Ring</p>
          <div className="mt-3 flex h-20 items-center justify-center rounded-lg border-2 border-ring/40 bg-ring/5">
            <span className="font-mono text-xs text-muted-foreground">--ring</span>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

/* ---------- 排版展示 ---------- */

const TYPO_ITEMS = [
  {
    name: "Display(大标题)",
    className: "text-display",
    spec: "var(--text-display) · 700 · 1.1",
    sample: "构建现代 Web 平台",
  },
  {
    name: "Title(页面标题)",
    className: "text-title",
    spec: "var(--text-title) · 700 · 1.2",
    sample: "设计系统规范",
  },
  {
    name: "Heading(区块标题)",
    className: "text-heading",
    spec: "var(--text-heading) · 600 · 1.3",
    sample: "区块标题示例",
  },
  {
    name: "Subheading(子标题)",
    className: "text-subheading",
    spec: "var(--text-subheading) · 500 · 1.5",
    sample: "子标题用于描述性内容",
  },
  {
    name: "Body(正文)",
    className: "text-body",
    spec: "var(--text-body) · 400 · 1.7",
    sample:
      "正文用于承载主要信息。保持 1.7 的行高以获得最佳中文阅读体验,段落间距使用 --space-stack。",
  },
  {
    name: "Body-sm(辅助文字)",
    className: "text-body-sm",
    spec: "var(--text-body-sm) · 400 · 1.6",
    sample: "辅助文字用于说明、描述与次要信息。",
  },
  {
    name: "Label(标签)",
    className: "text-label",
    spec: "var(--text-label) · 500 · 1.4 · 大写",
    sample: "Form Label / Section Label",
  },
  {
    name: "Caption(注释)",
    className: "text-caption",
    spec: "var(--text-caption) · 400 · 1.5",
    sample: "版权信息、时间戳、元数据等注释内容",
  },
]

function TypographyTab() {
  return (
    <div className="space-y-3">
      {TYPO_ITEMS.map((item) => (
        <div
          key={item.name}
          className="grid gap-2 rounded-lg border p-5 shadow-soft-sm sm:grid-cols-[240px_1fr] sm:items-baseline"
        >
          <div>
            <p className="text-body-sm font-medium">{item.name}</p>
            <p className="font-mono mt-1 text-xs text-muted-foreground">{item.spec}</p>
          </div>
          <p className={item.className}>{item.sample}</p>
        </div>
      ))}
    </div>
  )
}

/* ---------- 组件展示 ---------- */

function ButtonsSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-label text-muted-foreground">变体</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button>默认</Button>
          <Button variant="secondary">次要</Button>
          <Button variant="outline">描边</Button>
          <Button variant="ghost">幽灵</Button>
          <Button variant="destructive">危险</Button>
          <Button variant="link">链接</Button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-label text-muted-foreground">尺寸与图标</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">小</Button>
          <Button size="default">默认</Button>
          <Button size="lg">大</Button>
          <Button size="icon" aria-label="搜索">
            <Search />
          </Button>
          <Button size="icon" aria-label="通知">
            <Bell />
          </Button>
          <Button>
            <Sparkles />
            带图标
          </Button>
          <Button disabled>
            <Loader2 className="animate-spin" />
            加载中
          </Button>
          <Button variant="outline" disabled>
            <Copy />
            禁用
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-label text-muted-foreground">AsChild(链接按钮)</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/">返回首页</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
              <Github />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function CardsSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft-sm">
          <CardHeader>
            <CardTitle>标准卡片</CardTitle>
            <CardDescription>基于 shadcn/ui Card,统一圆角与内边距</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm">
              卡片内边距使用 --space-card。内容层级由 CardHeader / CardContent / CardFooter 组织。
            </p>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-caption">Footer 区域</p>
            <Button size="sm">操作</Button>
          </CardFooter>
        </Card>

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              玻璃卡片
            </CardTitle>
            <CardDescription>visionOS 风格毛玻璃,用于 Hero / 浮层场景</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm">
              半透明背景 + backdrop-blur-glass + 细亮边框 + shadow-soft,请放置在渐变或图片背景上展示质感。
            </p>
          </CardContent>
          <CardFooter>
            <Badge>Glass</Badge>
            <Badge variant="outline" className="ml-2">
              backdrop-blur 16px
            </Badge>
          </CardFooter>
        </GlassCard>
      </div>

      <div className="space-y-4">
        <p className="text-label text-muted-foreground">阴影层级(soft-sm / soft / soft-lg)</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { name: "soft-sm", cls: "shadow-soft-sm", desc: "卡片默认悬浮" },
            { name: "soft", cls: "shadow-soft", desc: "对话框 / 浮层" },
            { name: "soft-lg", cls: "shadow-soft-lg", desc: "Hero / 强调" },
          ].map((s) => (
            <div key={s.name} className={cn("rounded-lg border bg-card p-6 text-center", s.cls)}>
              <p className="text-body-sm font-medium">{s.name}</p>
              <p className="text-caption mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InputsSection() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="ds-name">姓名</Label>
          <Input id="ds-name" placeholder="请输入姓名" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ds-email">邮箱(带图标)</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ds-email" type="email" placeholder="you@example.com" className="pl-9" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ds-disabled">禁用状态</Label>
          <Input id="ds-disabled" disabled placeholder="不可输入" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ds-bio">简介</Label>
          <Textarea id="ds-bio" placeholder="写点什么…" />
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-label mb-3 text-muted-foreground">徽章</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>默认</Badge>
            <Badge variant="secondary">次要</Badge>
            <Badge variant="outline">描边</Badge>
            <Badge variant="destructive">危险</Badge>
            <Badge className="gap-1">
              <Check className="h-3 w-3" />
              成功
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-label mb-3 text-muted-foreground">头像</p>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>HL</AvatarFallback>
            </Avatar>
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-gradient-brand text-primary-foreground">DS</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div>
          <p className="text-label mb-3 text-muted-foreground">Skeleton(加载占位)</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackSection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-label w-full text-muted-foreground">对话框</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles />
              打开对话框
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认操作</DialogTitle>
              <DialogDescription>
                这是基于 Radix Dialog 的标准对话框,带缩放 + 滑动入场动画与柔和阴影。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ds-dialog-input">补充说明</Label>
                <Input id="ds-dialog-input" placeholder="可选…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setOpen(false)}>确认</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-label w-full text-muted-foreground">下拉菜单</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <User />
              用户菜单
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>个人资料</DropdownMenuItem>
            <DropdownMenuItem>偏好设置</DropdownMenuItem>
            <DropdownMenuItem>
              <Sun />
              亮色主题
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-label w-full text-muted-foreground">提示</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="主题">
                <Moon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>切换到暗色主题</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm">
                悬停查看提示
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tooltip 内容(带动画)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

function ComponentsTab() {
  return (
    <div className="space-y-10">
      <ButtonsSection />
      <Separator />
      <CardsSection />
      <Separator />
      <InputsSection />
      <Separator />
      <FeedbackSection />
    </div>
  )
}

/* ---------- 动效与表面展示 ---------- */

function MotionTab() {
  const animations = [
    { name: "fade-up", desc: "上浮淡入(默认)", delay: 0 },
    { name: "fade-in", desc: "纯淡入", delay: 100 },
    { name: "scale-in", desc: "缩放淡入", delay: 200 },
    { name: "fade-down", desc: "下落淡入", delay: 300 },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="text-body-sm mb-4">
          滚动到下方区域触发入场动画(IntersectionObserver + CSS 动画,只播放一次)。使用
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">AnimatedContainer</code>
          包裹任意内容,支持 <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">delay</code>{" "}
          错峰编排。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {animations.map((a) => (
            <AnimatedContainer key={a.name} animation={a.name as "fade-up"} delay={a.delay}>
              <Card className="p-6 shadow-soft-sm">
                <p className="text-body-sm font-medium">{a.name}</p>
                <p className="text-caption mt-1">{a.desc}</p>
              </Card>
            </AnimatedContainer>
          ))}
        </div>
      </div>

      <div>
        <p className="text-label mb-3 text-muted-foreground">持续动画(无需滚动)</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="anim-float rounded-lg border bg-card p-6 text-center shadow-soft-sm">
            <p className="text-body-sm font-medium">悬浮</p>
            <p className="text-caption mt-1">上下浮动 6s 循环</p>
          </div>
          <div className="anim-shimmer rounded-lg border bg-gradient-brand p-6 text-center text-primary-foreground shadow-soft-sm">
            <p className="text-body-sm font-medium">扫光</p>
            <p className="text-caption mt-1 text-primary-foreground/80">扫光 2.5s 循环</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-center shadow-soft-sm">
            <p className="text-body-sm font-medium">悬停</p>
            <p className="text-caption mt-1">组件自带过渡</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-label mb-3 text-muted-foreground">玻璃质感(建议置于渐变背景)</p>
        <div className="bg-gradient-brand relative overflow-hidden rounded-2xl p-8 shadow-soft-lg">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-indigo-300/30 blur-2xl" />
          <div className="relative grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5">
              <p className="text-body-sm font-medium">玻璃面板 1</p>
              <p className="text-caption mt-1 text-foreground/70">半透明毛玻璃面板</p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-body-sm font-medium">玻璃面板 2</p>
              <p className="text-caption mt-1 text-foreground/70">16px 背景模糊</p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-body-sm font-medium">玻璃面板 3</p>
              <p className="text-caption mt-1 text-foreground/70">细亮边框 + 柔和阴影</p>
            </GlassCard>
          </div>
        </div>
      </div>

      <div>
        <p className="text-label mb-3 text-muted-foreground">间距与圆角 Token</p>
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <p className="text-label text-muted-foreground">间距</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "--space-page", v: "clamp(1.25rem, 4vw, 2rem)", desc: "页面 padding" },
                { name: "--space-section", v: "clamp(3rem, 8vw, 6rem)", desc: "Section 间距" },
                { name: "--space-card", v: "1.5rem", desc: "卡片间距" },
                { name: "--space-grid", v: "1.5rem", desc: "Grid gap" },
                { name: "--space-stack", v: "1rem", desc: "垂直堆叠" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs">{s.name}</p>
                    <p className="text-caption">{s.desc}</p>
                  </div>
                  <div className="flex h-6 shrink-0 items-center overflow-hidden rounded border">
                    <div className="bg-primary h-full" style={{ width: 64 }} />
                    <span className="font-mono px-2 text-[10px] text-muted-foreground">{s.v}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-label text-muted-foreground">圆角</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "--radius (lg)", v: "1rem", size: "h-12 w-48 rounded-lg" },
                { name: "md", v: "0.875rem", size: "h-12 w-48 rounded-md" },
                { name: "sm", v: "0.75rem", size: "h-12 w-48 rounded-sm" },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs">{r.name}</p>
                    <p className="text-caption">{r.v}</p>
                  </div>
                  <div className={cn("bg-primary/80 shrink-0", r.size)} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

/* ---------- 页面主体 ---------- */

const TABS = [
  { value: "colors", label: "颜色" },
  { value: "typography", label: "排版" },
  { value: "components", label: "组件" },
  { value: "motion", label: "动效与表面" },
]

export function DesignSystemPage() {
  return (
    <PageContainer size="wide">
      <Section header={false} className="pt-10">
        <AnimatedContainer>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              设计系统 v1
            </Badge>
            <Badge variant="outline">Token 驱动</Badge>
            <Badge variant="outline">亮 / 暗双主题</Badge>
          </div>
          <h1 className="text-title mt-4">设计系统</h1>
          <p className="text-body-sm mt-2 max-w-2xl">
            本平台统一视觉规范。所有 Token 定义于 design-tokens.css,
            排版与动效类定义于 globals.css,公共组件位于 components/common/。
            后续所有页面与组件必须遵循本规范。点击右上角主题按钮体验暗色模式。
          </p>
        </AnimatedContainer>
      </Section>

      <Section header={false} className="pt-6">
        <Tabs defaultValue="colors">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="colors">
              <ColorsTab />
            </TabsContent>
            <TabsContent value="typography">
              <TypographyTab />
            </TabsContent>
            <TabsContent value="components">
              <ComponentsTab />
            </TabsContent>
            <TabsContent value="motion">
              <MotionTab />
            </TabsContent>
          </div>
        </Tabs>
      </Section>
    </PageContainer>
  )
}
