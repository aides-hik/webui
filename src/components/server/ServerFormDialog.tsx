import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { NewServer, Server } from "@/lib/mock-data"

interface ServerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 传入服务器则为编辑模式,否则为新增 */
  server?: Server | null
  onSubmit: (data: NewServer) => void
}

const EMPTY_FORM: NewServer = {
  name: "",
  ip: "",
  region: "ap-east-1",
  os: "Ubuntu 22.04 LTS",
  cores: 4,
  ram: "16 GB",
}

/**
 * 新增 / 编辑服务器表单对话框
 * 未来接入真实后端时,onSubmit 替换为 API 调用
 */
export function ServerFormDialog({
  open,
  onOpenChange,
  server,
  onSubmit,
}: ServerFormDialogProps) {
  const [form, setForm] = useState<NewServer>(EMPTY_FORM)
  const isEdit = Boolean(server)

  useEffect(() => {
    if (open) {
      setForm(
        server
          ? {
              name: server.name,
              ip: server.ip,
              region: server.region,
              os: server.os,
              cores: server.cores,
              ram: server.ram,
            }
          : EMPTY_FORM
      )
    }
  }, [open, server])

  const set = <K extends keyof NewServer>(key: K, value: NewServer[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = () => {
    if (!form.name.trim() || !form.ip.trim()) {
      toast.error("请填写服务器名称与 IP 地址")
      return
    }
    onSubmit(form)
    onOpenChange(false)
    toast.success(isEdit ? "服务器已更新" : "服务器已添加", {
      description: `${form.name} · ${form.ip}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑服务器" : "添加服务器"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改服务器配置信息。"
              : "添加一台新的服务器到平台(Mock,不会真实连接)。"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sf-name">名称</Label>
              <Input
                id="sf-name"
                placeholder="prod-web-02"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf-ip">IP 地址</Label>
              <Input
                id="sf-ip"
                placeholder="172.16.1.12"
                className="font-mono"
                value={form.ip}
                onChange={(e) => set("ip", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sf-region">区域</Label>
              <Input
                id="sf-region"
                placeholder="ap-east-1"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf-os">操作系统</Label>
              <Input
                id="sf-os"
                value={form.os}
                onChange={(e) => set("os", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sf-cores">CPU 核心</Label>
              <Input
                id="sf-cores"
                type="number"
                min={1}
                value={form.cores}
                onChange={(e) => set("cores", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sf-ram">内存</Label>
              <Input
                id="sf-ram"
                value={form.ram}
                onChange={(e) => set("ram", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "保存修改" : "添加服务器"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
