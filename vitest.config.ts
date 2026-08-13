import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/**
 * Vitest 配置 — React 组件测试
 * - jsdom DOM 环境
 * - @/ 别名与 Vite 一致
 * - setup 文件注入 jest-dom 匹配器
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
      include: ["src/services/permissionService.ts", "src/services/mockAuth.ts", "src/services/mockPermission.ts", "src/services/mockAudit.ts", "src/services/auditService.ts", "src/stores/authStore.ts", "src/components/auth/PermissionGuard.tsx"],
      exclude: ["src/tests/**", "src/services/websocket.ts", "src/services/mockServer.ts"],
      // CI 门槛:总体 statements/lines/functions ≥ 90%,branches ≥ 80%
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
})
