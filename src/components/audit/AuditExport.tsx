import { Download, FileJson, FileSpreadsheet } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AuditExportProps {
  onExport: (format: "csv" | "json") => void
  exporting: boolean
}

/**
 * 导出按钮 — CSV / JSON(当前筛选条件下的全量数据)
 */
export function AuditExport({ onExport, exporting }: AuditExportProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={exporting}>
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {exporting ? "导出中…" : "导出"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>导出当前筛选结果</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onExport("csv")}>
          <FileSpreadsheet />
          Export CSV
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">audit_logs.csv</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("json")}>
          <FileJson />
          Export JSON
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">audit_logs.json</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
