# WebUI Platform

服务器 / Docker 集群管理控制台前端。基于 React + TypeScript + Vite,内置 RBAC 权限模型,覆盖服务器、容器、监控、日志、应用、审计等模块。

> 当前版本默认运行在 **Mock 模式**(内置模拟数据,无需后端);配置 `VITE_API_BASE_URL` 后自动切换到真实 REST/WebSocket 后端。

## 功能特性

- **认证与权限**:登录、角色(管理员 / 运维 / 只读)、团队、资源级权限(全局 / 团队 / 分配范围)、审计日志
- **服务器管理**:列表、新增、详情、Agent 安装令牌、Web 终端(xterm)
- **Docker 容器**:容器与镜像列表、启停 / 重启
- **监控与日志**:CPU / 内存 / 网络时序图表、平台与单机日志
- **应用与用户**:应用状态、用户 / 团队 / 角色 / 服务器访问授权管理
- **设计系统**:内置组件与设计规范展示页

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS · Radix UI · Zustand · TanStack Query · React Router(Hash)· xterm · Vitest

## 快速开始

```bash
pnpm install          # 安装依赖
pnpm dev              # 本地开发(http://localhost:5173)
pnpm type-check       # TypeScript 类型检查
pnpm test             # 运行测试
pnpm test:coverage    # 测试 + 覆盖率
pnpm build            # 生产构建(输出 dist/)
pnpm preview          # 预览生产构建
```

### 演示账号(Mock 模式)

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123` | 管理员(全部权限) |
| `zhangwei` | `123456` | 运维 |
| `lina` | `123456` | 运维 + 只读 |
| `chenyu` | `123456` | 只读 |

## 环境变量

所有暴露给浏览器的变量必须以 `VITE_` 开头。详见 [.env.example](./.env.example)。

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 否 | REST API 基础地址。留空 = Mock 模式 |
| `VITE_WS_URL` | 否 | WebSocket 地址。留空 = Mock 事件总线 |

- 本地开发:复制 `.env.example` 为 `.env.local` 后填写。
- 生产 / 预览:配置到 GitHub Secrets(`VITE_API_BASE_URL`、`VITE_WS_URL`),由 Workflow 在构建期注入;或配置到 Vercel 项目的 Environment Variables。

> **安全提醒**:`TOKEN_SECRET` 等鉴权 / 签名密钥属于**后端机密**,严禁以 `VITE_` 前缀暴露到前端 —— 任何 `VITE_` 变量都会被打包进浏览器 bundle,公开可见。后端密钥请配置在后端部署环境。

## 部署(Vercel)

本项目为纯静态 SPA,使用 **Hash Router**,所有路由(如 `/#/dashboard`)都由前端处理,无需服务端重写规则,刷新页面即可正常加载。

### 部署方式:Vercel 原生 GitHub 集成

仓库已通过 Vercel 原生 Git 集成接入部署,无需维护部署 Workflow:

- push 到 `main` → Vercel 自动构建并部署生产环境
- 打开 Pull Request → Vercel 自动生成 Preview 部署,并在 PR 中评论预览链接
- 根目录 [vercel.json](./vercel.json) 指定 `pnpm install` → `pnpm build` → 部署 `dist/`

前端环境变量(可选,留空即 Mock 模式)在 Vercel 项目 **Settings → Environment Variables** 配置:

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 生产 REST 地址(留空走 Mock) |
| `VITE_WS_URL` | 生产 WebSocket 地址(留空走 Mock) |

## CI / CD 流程

| 阶段 | 工具 | 触发 | 内容 |
| --- | --- | --- | --- |
| 质量门禁 | GitHub Actions `ci.yml` | push `main`、PR | 类型检查 → 测试 + 覆盖率 → 权限模块 100% 覆盖率校验 → 生产构建 |
| 生产部署 | Vercel 原生集成 | push `main` | 构建并部署 `dist/` |
| 预览部署 | Vercel 原生集成 | PR | 生成 Preview 并评论预览链接 |

## 目录结构

```
src/
├── api/            # REST 客户端与 API 出口(Mock/Real 自动切换)
├── components/     # 业务组件 + ui/ 基础组件
├── hooks/          # 自定义 hooks
├── layouts/        # 布局
├── pages/          # 页面
├── router/         # 路由与权限守卫
├── services/       # Mock 服务、WebSocket、权限服务
├── stores/         # Zustand 状态
├── styles/         # 全局样式与设计令牌
├── tests/          # 测试
└── types/          # 类型定义
```
