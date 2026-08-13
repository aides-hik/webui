import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface AuditPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

/** 生成页码序列(含省略号) */
function pageItems(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items: (number | "ellipsis")[] = [1]
  if (current > 3) items.push("ellipsis")
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p += 1) {
    items.push(p)
  }
  if (current < totalPages - 2) items.push("ellipsis")
  items.push(totalPages)
  return items
}

/**
 * 底部分页栏 — 当前页 / 总数 / 每页数量 / 上下页
 */
export function AuditPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: AuditPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
      <div className="flex items-center gap-2 text-caption">
        <span>
          共 {total} 条 · 第 {page} / {totalPages} 页
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-7 rounded-md border bg-background px-1.5 text-xs outline-none"
          aria-label="每页数量"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>每页 {size} 条</option>
          ))}
        </select>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>

          {pageItems(page, totalPages).map((item, i) =>
            item === "ellipsis" ? (
              <PaginationItem key={`e-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  isActive={item === page}
                  onClick={() => onPageChange(item)}
                  className="h-8 w-8"
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
