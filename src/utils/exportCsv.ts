/* ============================================================
   导出工具 — CSV / JSON
   ------------------------------------------------------------
   - 大数据量(5000+)分块生成并让出主线程,避免阻塞 UI
   - CSV 带 BOM,Excel 直接打开中文不乱码
   - 未来数据量进一步增大时,可迁移至 Web Worker:
     new Worker(new URL("./exportWorker.ts", import.meta.url), { type: "module" })
   ============================================================ */

/** CSV 字段转义(逗号 / 引号 / 换行) */
function escapeCsv(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const CHUNK_SIZE = 500

/** 触发浏览器下载 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 导出 CSV(异步分块,大数据量不阻塞主线程)
 * rows:二维数组,首行为表头
 */
export async function exportCsv(rows: (string | number)[][], filename: string) {
  const chunks: string[] = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const slice = rows.slice(i, i + CHUNK_SIZE)
    chunks.push(slice.map((row) => row.map(escapeCsv).join(",")).join("\n"))
    // 让出主线程,保持 UI 响应
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  const csv = "\uFEFF" + chunks.join("\n") // BOM:Excel 中文兼容
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename)
}

/** 导出 JSON(异步分块序列化,大数据量不阻塞主线程) */
export async function exportJson(data: unknown[], filename: string) {
  const parts: string[] = []
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    parts.push(JSON.stringify(data.slice(i, i + CHUNK_SIZE)).slice(1, -1))
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  const json = `[\n${parts.join(",\n")}\n]`
  downloadBlob(new Blob([json], { type: "application/json;charset=utf-8" }), filename)
}
