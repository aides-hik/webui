import { PageContainer } from "@/components/common/PageContainer"
import { GeneralSettings } from "@/components/settings/GeneralSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { SecuritySettings } from "@/components/settings/SecuritySettings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * 平台设置 — 常规 / 安全 / 通知
 */
export function Settings() {
  return (
    <PageContainer size="narrow" className="py-2">
      <div className="mb-4">
        <h2 className="text-title text-xl">设置</h2>
        <p className="text-caption mt-0.5">平台配置与偏好</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">常规</TabsTrigger>
          <TabsTrigger value="security">安全</TabsTrigger>
          <TabsTrigger value="notification">通知</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="notification" className="mt-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
