/* ============================================================
   API 桶 — 副作用导入
   ------------------------------------------------------------
   应用启动时统一加载全部 api 模块,确保:
   1. api/access 完成资源范围数据提供者注册(先于任何权限判定);
   2. Mock 实现的运行时数据(用户/团队/分配等)就绪。
   真实后端接入后此桶无需改动。
   ============================================================ */

import "@/api/access"
import "@/api/application"
import "@/api/audit"
import "@/api/auth"
import "@/api/monitoring"
import "@/api/server"
import "@/api/team"
import "@/api/user"

export {}
