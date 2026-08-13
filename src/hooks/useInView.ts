import { useEffect, useRef, useState } from "react"

/**
 * 元素进入视口检测(触发一次)
 * 用于滚动驱动的入场动画
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  const { root = null, rootMargin = "0px", threshold = 0.15 } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [root, rootMargin, threshold])

  return { ref, inView }
}
