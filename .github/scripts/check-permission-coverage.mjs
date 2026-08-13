/**
 * 权限模块覆盖率检查 — 要求核心权限文件行覆盖 100%
 * 读取 vitest 的 coverage-final.json,按文件名匹配目标模块。
 * 用法:node .github/scripts/check-permission-coverage.mjs
 */
import fs from "fs"
import path from "path"

const REPORT = "coverage/coverage-final.json"
const TARGETS = [
  "permissionService.ts",
  "mockPermission.ts",
  "mockAuth.ts",
  "PermissionGuard.tsx",
]

if (!fs.existsSync(REPORT)) {
  console.error(`未找到覆盖率报告: ${REPORT} —— 请先运行 pnpm test:coverage`)
  process.exit(1)
}

const report = JSON.parse(fs.readFileSync(REPORT, "utf8"))
let allPass = true

for (const [filePath, data] of Object.entries(report)) {
  const name = path.basename(filePath)
  if (!TARGETS.includes(name)) continue

  const stmts = data.s ?? {}
  const total = Object.keys(stmts).length
  const covered = Object.values(stmts).filter((v) => v > 0).length
  const pct = total === 0 ? 100 : (covered / total) * 100
  const pass = pct >= 100
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"} ${name}: ${pct.toFixed(2)}% (${covered}/${total})`)
  if (!pass) allPass = false
}

if (!allPass) {
  console.error("\n权限模块覆盖率未达 100%,CI 阻断。")
  process.exit(1)
}
console.log("\n权限模块覆盖率检查通过:100% ✓")
