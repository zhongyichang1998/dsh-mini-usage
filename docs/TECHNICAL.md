# P0 技术结论与适配依据

目标官方 tag：`dsh-v0.2.0-rc.2`，commit `639ed015397290b3745d163aafe02ffee4aa3f84`。兼容性范围限此版本；其他版本尚未验证。

| 问题 | 核验结论 |
| --- | --- |
| Cordis 架构 | Host 导出 inject/apply，使用 ctx.effect 绑定路由/计时器清理。rc.2 vendored Cordis 是 4.0.4 |
| 独立打包 | package.json dsh.bundle.patch + cordis.patch.yml 插入独立节点；无运行时 npm 依赖 |
| Client 加载 | exports ./client + dsh.client.platform:web；CJS 代码封装成 window.__ModuleLoader__.load；React 由宿主 require 提供 |
| Footer | sidebar.footer.action 为 root/list slot，props wide 表示展开；使用 slots.inject 跟随声明生命周期 |
| 布局限制 | footerActions 是横向 flex，不换行。自身 min-width:32px 并依据可用宽度隐藏文字，不能解决其他插件拒绝收缩或数量无上限的宿主溢出 |
| 通信 | 同源只读 HTTP exact route，回环地址/Host/Origin/自定义头检查；没有 credentials 服务依赖 |
| 历史数据 | 官方 sessionPersistence 列表 + read handle；seq 从 0 开始，read offset 包含该 seq |
| 分叉 | inheritedEventCount 来自 read handle，排除继承前缀，避免跨会话双计 |
| 增量 | revision 只在同一服务实例中比较；持久化游标和每日折叠，重启检查边界再续读 |
| UI 叠层 | 原生 Popover top layer；局部 CSS、ResizeObserver、Escape/外部点击关闭，无 app.asar 修改 |

官方依据：

- [Slots 文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/subsystems/slots.md)
- [SidebarRoot](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/client/ui-sidebar/src/client/SidebarRoot.tsx)
- [Footer CSS](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/client/ui-sidebar/src/client/SidebarRoot.module.css)
- [官方 Usage fold](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/llm/token-meter/src/usage-projection.ts)
- [Persistence](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/session/session-persistence/src/index.ts)
- [Read handle](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/session/session-persistence/src/handle.ts)
- [客户端模块加载](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/subsystems/client-modules.md)

参考项目：Ychris12138/dsh-usage-stats，读取 commit `da11021f432ab7de836704e09acd9e6024fd34e7`（MIT）。仅用于理解生态加载/安装形态及历史统计策略；本项目独立编写，没有复制其界面、余额服务或费用逻辑。其旧 assistant/chunk 统计路径不直接适用于这里核验的目标版本，故以官方结算事件为准。

## 已知数据边界

没有可靠 Usage 时不估算。LLM compaction summary 没有 Usage 时计为不可用；未留下任何公开事件的其他后台调用无法识别。删除 Session 后从后续快照移除该会话的统计，不作为永久账本。后台失败不会打断聊天。

存储后端可在首次打开某个变化文件时解压整份日志；插件只缓存折叠结果，无法保证底层磁盘读取完全 O(新增事件)。极大历史首次索引可能超过前端 60 秒请求超时，Host 会继续完成并在后续刷新提供结果。
