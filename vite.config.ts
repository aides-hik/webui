import path from "path"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

/**
 * Vite 构建配置
 * - 路径别名 @/ → ./src
 * - manualChunks 拆分 vendor / ui / state / terminal
 * - rollup-plugin-visualizer 生成依赖分析报告(dist/stats.html)
 */
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined

          // 动画库(framer-motion):仅审计页等少数页面使用
          if (id.includes("framer-motion") || id.includes("motion-dom")) return "animation"

          // 终端(xterm)独立 chunk:体积大且仅终端页面需要
          if (id.includes("@xterm")) return "terminal"

          // UI 基础库:radix 原语 + 样式工具 + 图标
          if (
            id.includes("@radix-ui") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge") ||
            id.includes("lucide-react")
          ) {
            return "ui"
          }

          // 状态层:Zustand + TanStack Query + sonner
          if (
            id.includes("zustand") ||
            id.includes("@tanstack") ||
            id.includes("sonner")
          ) {
            return "state"
          }

          // 核心框架
          if (
            id.includes("react-router") ||
            id.includes("react-dom") ||
            id.includes("/react/") ||
            id.includes("scheduler")
          ) {
            return "vendor"
          }

          // 其余第三方依赖
          return "vendor-other"
        },
      },
    },
  },
})
