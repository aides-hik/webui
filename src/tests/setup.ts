import "@testing-library/jest-dom/vitest"

import { afterAll, afterEach, vi } from "vitest"

/* ---------- MockServer 实时定时器:测试环境关闭,避免 open handle ---------- */

import { mockServer } from "@/services/mockServer"

mockServer.stop()

/* ---------- 每个测试后清理 ---------- */

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ""
})

afterAll(() => {
  mockServer.stop()
})
