import "@testing-library/jest-dom/vitest"

import { afterAll, afterEach, vi } from "vitest"

/* ---------- MockServer 实时定时器:测试环境关闭,避免 open handle ---------- */

import { mockServer } from "@/services/mockServer"

mockServer.stop()

/* ---------- 资源范围数据提供者注册(permissionService 依赖) ---------- */
/* 与应用入口(api/index → api/access)保持一致,先于任何权限判定 */

import "@/api/access"

/* ---------- 每个测试后清理 ---------- */

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ""
})

afterAll(() => {
  mockServer.stop()
})
