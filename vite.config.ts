import path from "path"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

/**
 * Vite 构建配置
 * - 路径别名 @/ → ./src
 * - manualChunks 仅拆分 terminal(xterm)/ animation(framer-motion),
 *   其余交给 Rollup 自动分组,避免跨 chunk 循环依赖
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

          // 终端(xterm)独立 chunk:体积大且仅终端页面需要
          if (id.includes("@xterm")) return "terminal"

          // 动画库(framer-motion)独立 chunk:仅少数页面使用
          if (id.includes("framer-motion") || id.includes("motion-dom")) return "animation"

          // 其余依赖不手动拆包,交给 Rollup 自动分组。
          // 避免 React 与 react-router/@remix-run 等被拆进不同 chunk
          // 形成循环依赖,导致生产构建运行时 React 为 undefined。
          return undefined
        },
      },
    },
  },
})
