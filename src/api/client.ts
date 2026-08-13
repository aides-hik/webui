/* ============================================================
   HTTP 客户端 — 基于 fetch 的轻量封装
   - 统一 JSON 序列化 / 错误处理 / 超时
   - BASE_URL 通过 VITE_API_BASE_URL 配置(未配置时为空,
     由 api/server.ts 自动切换到 Mock 实现)
   ============================================================ */

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/+$/, "") ?? ""

/* ---------- Auth Interceptor ---------- */

type TokenProvider = () => string | null
type UnauthorizedHandler = () => void

let tokenProvider: TokenProvider | null = null
let unauthorizedHandler: UnauthorizedHandler | null = null

/** 注册 Token 提供者(authStore 在模块加载时调用) */
export function setAuthTokenProvider(fn: TokenProvider) {
  tokenProvider = fn
}

/** 注册 401 处理(会话失效 → 登出) */
export function setOnUnauthorized(fn: UnauthorizedHandler) {
  unauthorizedHandler = fn
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  params?: object
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, timeout = 15_000, headers, ...rest } = options

  // 拼接 query 参数
  const url = new URL(BASE_URL + path, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  // 自动附加 Authorization: Bearer <token>
  const token = tokenProvider?.()
  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : undefined

  try {
    const res = await fetch(url, {
      ...rest,
      headers: { "Content-Type": "application/json", ...authHeaders, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })

    if (res.status === 401) {
      unauthorizedHandler?.()
      throw new ApiError("登录已过期,请重新登录", 401)
    }
    if (res.status === 403) {
      throw new ApiError("没有权限执行此操作", 403)
    }
    if (!res.ok) {
      throw new ApiError(`请求失败 ${res.status} ${res.statusText}`, res.status)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(`请求超时(${timeout}ms): ${path}`, 408)
    }
    throw new ApiError(`网络错误: ${path}`, 0)
  } finally {
    window.clearTimeout(timer)
  }
}

/** REST 动词封装 */
export const api = {
  get: <T>(path: string, params?: object) =>
    request<T>(path, { method: "GET", params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),

  delete: <T>(path: string, params?: RequestOptions["params"]) =>
    request<T>(path, { method: "DELETE", params }),
}
