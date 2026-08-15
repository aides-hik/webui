/**
 * Mock 数据边界检查 — UI 层禁止直接引用 mock 实现/种子数据
 * ------------------------------------------------------------
 * 规则:业务数据访问统一走 src/api/*。
 * - 允许引用:src/api/**、src/services/**(mock 实现层)、src/tests/**(测试)
 * - 禁止引用(UI 层 pages/components/stores/hooks/layouts):
 *   @/services/mockAuth · mockAudit · mockPermission · mockServer · auditService
 *   @/lib/mock-data
 * 用法:node .github/scripts/check-mock-boundary.mjs
 */
import fs from "fs"
import path from "path"

const ROOT = path.resolve(import.meta.dirname, "../..")
const SRC = path.join(ROOT, "src")

const ALLOWED_DIRS = ["api", "services", "tests"]

/** UI 层禁止出现的 import 来源(子串匹配) */
const FORBIDDEN = [
  "@/services/mockAuth",
  "@/services/mockAudit",
  "@/services/mockPermission",
  "@/services/mockServer",
  "@/services/auditService",
  "@/lib/mock-data",
]

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

const files = walk(SRC)
let violations = []

for (const file of files) {
  const rel = path.relative(SRC, file)
  const top = rel.split(path.sep)[0]
  if (ALLOWED_DIRS.includes(top)) continue

  const content = fs.readFileSync(file, "utf8")
  for (const forbidden of FORBIDDEN) {
    // 匹配 import 语句(含 type import);注释中的字符串不触发
    const re = new RegExp(`import[^;]*['"]${forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`, "g")
    const matches = content.match(re)
    if (matches) {
      violations.push(`${rel}: ${matches.join(" | ")}`)
    }
  }
}

if (violations.length > 0) {
  console.error("❌ UI 层存在对 mock 数据层的直接引用(应统一走 src/api/*):")
  for (const v of violations) console.error(`  - ${v}`)
  console.error("\n修复:将数据访问迁移到 api 层(如 userApi / teamApi / accessApi / auditApi),或移动文件到允许目录。")
  process.exit(1)
}

console.log("✅ Mock 数据边界检查通过:UI 层无直接引用。")
