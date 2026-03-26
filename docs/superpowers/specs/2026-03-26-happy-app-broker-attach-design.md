# Happy App Broker Attach 设计

状态：设计已通过，待文档审阅  
日期：2026-03-26

## 1. 背景

`happy-vscode-bridge` 和 `happy-cli` 已经基本打通了 broker-backed session 的本地附着链路：

- `happy-vscode-bridge` 能发现官方 `Claude` / `Codex` live session，并暴露 `discover / attach / send / interrupt / approval / events`
- `happy-cli` 已经能把 broker session 映射成稳定的 Happy session，并通过 relay 承接文本、interrupt、approval 和 run status
- `happy-app` 机器页已经有 broker attach 入口，attach 成功后也能跳转到 Happy session

但当前移动端体验仍停留在“能点进去”的阶段，没有完成“能一眼看懂自己在控制哪一条 VS Code live session”的产品收口。

目前存在的核心缺口是：

- attach 列表还是 session 平铺视角，没有把 `VS Code 窗口 / 工作区` 建模成第一层
- attach 成功后的 session 页只有一行轻提示，无法稳定表达“当前控制目标”
- 多窗口、多 provider、降级附着这些真实场景，还没有在 app 侧形成明确的信息层级

因此，本次设计的目标不是继续扩展 bridge 协议本体，而是把 `happy-app` 的 broker attach 体验收口成一条可判断、可附着、可持续共控的产品链路。

## 2. 本次设计要解决的问题

本次设计要解决两个连续问题：

1. 用户如何在手机上从多个 `VS Code` 窗口、多个 provider、多个 live session 里选对目标
2. attach 成功后，用户如何持续知道自己正在控制哪一个窗口里的哪一条 live session，而不会误操作到别的会话

本次设计确认采用以下产品前提：

1. attach 列表的第一层身份必须是 `VS Code 窗口 / 工作区`
2. 同一个窗口里的 `Claude` 和 `Codex` 必须始终视为两条独立可附着 session
3. attach 成功后的首屏要先给强确认，再快速把注意力还给聊天正文
4. broker 能力降级必须在 attach 列表和 session 页都显式可见

## 3. 非目标

本次设计明确不包含以下内容：

- 不从 `happy-app` 反向创建新的官方 `VS Code` 插件会话
- 不改变 broker relay 的底层事件投影语义
- 不在本次设计里扩展图片输入、artifact 预览、编辑器上下文浏览
- 不设计多移动端强一致共控冲突处理
- 不把 session 页改造成新的 broker diagnostics 面板
- 不解决所有 broker instance 发现机制的实现细节；这里只定义 app 为了正确工作所依赖的数据契约

## 4. 为什么不选其它方案

### 4.1 方案 A：继续平铺所有 broker session

定义：

- 机器页继续显示一个平铺 session 列表
- 每条只在 subtitle 里追加 provider / degraded 文案

优点：

- 改动最少
- 可复用现有 `ItemGroup` 结构

缺点：

- 多窗口时用户需要自己猜 session 属于哪个 `VS Code` 窗口
- 同名 workspace 或同窗双 provider 时，误 attach 风险明显
- attach 成功后的身份锚点仍然不清楚

### 4.2 方案 B：按 VS Code 窗口分组，再显示组内 session

定义：

- attach 列表第一层显示 `VS Code` 窗口 / 工作区实例
- 每个窗口组下展示该窗口里的 `Claude` / `Codex` live session
- attach 成功后，在 session 页以轻量 live strip 持续表达 `provider + window/workspace`

优点：

- 与用户心智一致，先认窗口再认 session
- 可以自然承接“同窗 Claude + Codex 并列”以及“多窗口同名 workspace 去歧义”
- attach 后的当前控制目标有稳定锚点

缺点：

- 需要 app / machine RPC / broker DTO 一起补齐窗口身份数据
- 需要定义窗口分组和重名去歧义规则

### 4.3 方案 C：先选窗口，再进入二级页选 session

定义：

- 机器页先展示窗口列表
- 用户进入窗口详情后，再看到组内 session

优点：

- 层级最清楚
- 多窗口极多时更整洁

缺点：

- attach 路径多一步
- 对当前规模来说偏重，不利于快速附着

### 4.4 结论

正式采用 `方案 B`：

> app 侧的 attach 体验以 `VS Code 窗口 / 工作区` 为第一层信息架构，在组内显示各个 provider session，并在 attach 成功后通过轻量常驻 strip 持续表达当前控制目标。

## 5. 核心体验原则

### 5.1 先认窗口，再认 session

attach 列表不能从“session title”开始，因为真实目标不是抽象的一条 broker session，而是“某个 `VS Code` 窗口中的某条 provider live session”。

因此列表顺序固定为：

1. `窗口 / 工作区身份`
2. `provider`
3. `session 标题`
4. `attachability / degraded / 模式信息`

### 5.2 attach 成功后尽快回到正文

用户需要确认“已接管成功”，但不需要长期盯着一块大 Banner。

因此成功提示的节奏是：

- 先短暂展开确认
- 然后折叠为贴着会话顶部的轻量 strip
- 之后正文重新成为第一视觉焦点

### 5.3 常驻条只保留最小身份锚点

折叠 strip 默认只保留以下信息：

- `provider`
- `window / workspace`
- `live 状态`

例如：

- `Codex · api-repo.code-workspace`
- `Window 1 · Runtime attached · interrupt + approval synced`

其它信息只在详情层或即时状态卡里出现，不让 strip 变成常驻控制台。

### 5.4 降级可见，但不绑架主界面

`storage fallback`、`approval unavailable`、`read_only_attach` 等必须清楚可见，但应该通过列表标签、详情层或即时状态卡表达，而不是把 session 页常驻 strip 做成告警面板。

## 6. app 侧数据契约

本次设计依赖一个关键事实：

> `happy-app` 只有在拿到“broker session 属于哪个 VS Code 窗口 / 工作区”的数据后，才能正确实现窗口分组与去歧义。

因此，本次设计要求 app 可消费的 broker attach 数据至少包含两层身份。

### 6.1 v1 默认数据路径

v1 明确采用以下默认路径：

- `machine RPC` 继续返回一个扁平的 `sessions[]`
- 但每条 session 都必须内嵌其所属窗口的 identity 字段
- `happy-app` 在本地按这些字段完成窗口分组

不采用“先返回 `windows[]`，再单独拉每个窗口 session”的二级 API。

选择这条路径的原因：

- 与当前 `broker-list-sessions -> sessions[]` 形态最接近
- 不需要为 app 新建一套窗口详情接口
- attach RPC 可以继续只接收 `brokerSessionId`

实现计划必须围绕这一默认路径展开；若后续发现底层数据无法支撑，再单独起设计，不在本轮计划中保留双路线并行。

### 6.2 v1 最小字段清单

#### MUST：窗口身份字段

每条 app 可消费的 broker session DTO 必须包含：

- `windowInstanceId: string`
- `windowLabel: string`
- `workspaceLabel: string`
- `windowOrdinal: number`
- `isActiveWindow: boolean`

其中：

- `windowInstanceId` 是 app 分组用的主键，语义是“当前机器上每个活动 `VS Code` 窗口唯一”
- `windowLabel` 是窗口级展示名，可等于 workspace 名，也可为更贴近窗口的标题
- `workspaceLabel` 用于组标题或二级补充说明
- `windowOrdinal` 只用于同名窗口去歧义，不作为真实身份键
- `isActiveWindow` 用于排序和标签

`windowInstanceId` 的稳定性要求是：

- 在同一次 `VS Code` 窗口生命周期内稳定
- 不要求跨 `VS Code` 重启保持不变
- 不允许在同一时刻的两个活动窗口之间复用

#### SHOULD：窗口补充字段

建议补充：

- `workspacePath: string | null`
- `windowLastActiveAt: string | null`

其中：

- `workspacePath` 用于同名窗口二次去歧义
- `windowLastActiveAt` 采用 ISO 时间字符串，用于窗口排序；缺失时必须可降级

#### MUST：session 字段

继续沿用现有 broker session 字段，并要求每条 DTO 至少包含：

- `brokerSessionId: string`
- `provider: 'claude' | 'codex'`
- `title: string`
- `attachability: 'attachable' | 'attachable_with_degraded_capabilities' | 'not_attachable'`
- `desiredMode: 'runtime_preferred' | 'storage_preferred'`
- `effectiveMode: 'runtime' | 'storage'`
- `modeReason: string`
- `degradedFlags: string[]`
- `capabilities: string[]`

#### MUST：v1 UI 关心的最小 capability 集合

v1 不要求 app 为任意未知 capability 做专门 UI，但实现计划与测试必须至少覆盖这些已存在且会影响 UI 的能力值：

- `sendUserMessage`
- `interrupt`
- `resolveApproval`
- `captureEditorContext`

其中：

- strip 副文案只允许用 `sendUserMessage / interrupt / resolveApproval` 生成“可发送 / 可中断 / 可审批”这类摘要
- `captureEditorContext` 在 v1 不进入 strip 文案，只用于详情层或后续扩展
- 未知 capability 一律忽略，不单独生成 UI 分支

#### MUST：v1 支持的最小 `modeReason`

v1 规划与测试必须至少覆盖当前代码里已经存在的这些值：

- `runtime_ready`
- `runtime_degraded`
- `runtime_unavailable_fallback_to_storage`
- `storage_preferred_selected`
- `storage_stale_selected`

#### MUST：v1 支持的最小 `degradedFlags`

v1 规划与测试必须至少覆盖当前代码和 app 文案层已经出现的这些值：

- `read_only_attach`
- `interrupt_bridge_unavailable`
- `approval_bridge_unavailable`
- `attachment_bridge_unavailable`
- `selection_context_stale`
- `unstable_session_identity`
- `stale_storage_state`

如果后续出现未知 flag，app 可以降级显示通用文案，但实现计划不能把未知值支持当作 v1 主线。

### 6.3 Broker Instance / Window Identity

每个 attachable 目标必须能归属到一个 `VS Code` 窗口实例。app 侧至少需要上文定义的窗口 `MUST` 字段：

- `windowInstanceId`
- `windowLabel`
- `workspaceLabel`
- `windowOrdinal`
- `isActiveWindow`

并建议补充：

- `workspacePath`
- `windowLastActiveAt`

这些字段可以直接来自 broker manifest，也可以来自 machine RPC 汇总层；本次设计不强行规定来源，只规定 app 必须拿到可用于分组和去歧义的数据。

### 6.4 Session Identity

窗口组内的每条 session 仍然以现有 broker session 模型为基础：

- `brokerSessionId`
- `provider`
- `title`
- `attachability`
- `capabilities`
- `degradedFlags`
- `desiredMode / effectiveMode / modeReason`

关键要求是：

- 同窗 `Claude` 和 `Codex` 不能合并
- 相同标题的 session 也必须能通过窗口身份和 provider 正确区分

### 6.5 现实约束

当前实现里，`happy-app -> machine RPC` 仍是单 broker manifest 视角，默认读取 `~/.happy-vsc/broker/instance.json`。这与“多窗口分组”的最终产品形态不完全一致。

因此实现计划阶段必须把以下事项作为显式前置条件：

1. machine RPC 聚合 broker instance discover 结果
2. 返回的 `sessions[]` 补齐上文定义的窗口身份字段

无论底层如何实现聚合，app 不应在缺少这些字段的前提下直接硬做分组 UI。

### 6.6 兼容与降级路径

v1 需要兼容“app 已升级，但 machine RPC / broker DTO 还没补齐窗口字段”的老版本组合。

兼容策略固定为：

- 如果 machine 页拿到的 broker session DTO 已包含 `windowInstanceId / windowLabel / workspaceLabel`
  - 使用新分组 UI
- 如果缺少这些字段
  - 回退到当前的平铺 session 列表
  - 在 broker 区顶部显示一条轻提示：`升级 bridge / cli 后可按 VS Code 窗口分组`

不采用“直接隐藏 broker attach 入口”或“字段缺失时直接报错阻断”。

原因：

- 这样可以保持当前 attach 主链路继续可用
- 允许 app 先发版，再等待 machine 侧升级逐步解锁分组体验
- 回滚策略也更简单：字段缺失只影响新分组体验，不影响旧 attach 能力

### 6.7 attach 后 Happy session metadata 契约

为保证跳转后、重连后、从 recent 列表重新进入时仍然能拿到正确的身份锚点，v1 明确要求 relay 在创建或恢复 Happy session 时，把以下字段写入 session metadata。

#### MUST：attach 后 metadata 字段

- `flavor = 'claude' | 'codex'`
- `sessionSource = 'broker_attached'`
- `brokerSessionId`
- `brokerDesiredMode`
- `brokerEffectiveMode`
- `brokerModeReason`
- `brokerDegradedFlags`
- `brokerProviderExtension`
- `windowInstanceId`
- `brokerWindowLabel`
- `brokerWorkspaceLabel`

#### SHOULD：attach 后 metadata 字段

- `brokerWorkspacePath`
- `brokerWindowOrdinal`
- `brokerCapabilities`
- `brokerCompatibility`
- `brokerProbeHealth`

写入责任固定为：

- `happy-cli` 的 `BrokerRelayRunner` 在 `getOrCreateSession(...)` 前准备 metadata
- `happy-server` 只按现有 session metadata 同步与持久化
- `happy-app` 的 session 页只消费已有 metadata，不再回头依赖 machine discover DTO

这些字段在 attach 成功跳转到 session 页时必须已经可用；不能要求 app 额外等待一次 machine 侧补拉，才能渲染 strip。

其中 provider 的来源固定为：

- session 页 strip 与详情层读取现有 Happy session metadata 的 `flavor`
- 不依赖 machine discover DTO
- v1 不新增单独的 `brokerProvider` 字段

字段映射与 UI 使用优先级固定为：

| 语义 | machine discover DTO | attach 后 session metadata | happy-app UI 用法 |
|------|----------------------|----------------------------|-------------------|
| 窗口分组主键 | `windowInstanceId` | `windowInstanceId` | 机器页分组永远用它；session 页只用于稳定 identity，不直接展示 |
| 窗口展示名 | `windowLabel` | `brokerWindowLabel` | strip 和详情层主展示名优先使用它 |
| workspace 展示名 | `workspaceLabel` | `brokerWorkspaceLabel` | strip/详情层的二级展示名与回退文案使用它 |
| workspace 路径 | `workspacePath` | `brokerWorkspacePath` | 去歧义和详情层使用；不作为主键 |
| 同名窗口序号 | `windowOrdinal` | `brokerWindowOrdinal` | 仅在重名时展示；不作为主键 |
| provider | `provider` | `flavor` | provider pill 与 strip 主文案使用它 |

约束：

- 机器页分组键永远使用 discover DTO 的 `windowInstanceId`
- attach 后 session 页锚点永远使用 metadata 的 `windowInstanceId + brokerWindowLabel`
- 展示名允许不同命名，但语义必须一一对应，不允许把 `workspaceLabel` 当主键

一个合法的 v1 metadata 示例：

```json
{
  "flavor": "codex",
  "sessionSource": "broker_attached",
  "brokerSessionId": "codex-9b1f2f7a31ab",
  "brokerDesiredMode": "runtime_preferred",
  "brokerEffectiveMode": "runtime",
  "brokerModeReason": "runtime_ready",
  "brokerDegradedFlags": ["attachment_bridge_unavailable"],
  "brokerProviderExtension": {
    "id": "openai.chatgpt",
    "version": "1.2026.84"
  },
  "windowInstanceId": "win-7f1d2a",
  "brokerWindowLabel": "api-repo.code-workspace",
  "brokerWorkspaceLabel": "api-repo",
  "brokerWorkspacePath": "~/work/api-repo",
  "brokerWindowOrdinal": 1
}
```

### 6.8 attach 后运行时状态来源

`approval pending`、broker run status、assistant delta 等 attach 之后的动态状态，不来自 machine 页 discover DTO。

attach 之后，app 必须继续依赖既有 Happy session 同步链路：

- `BrokerRelayRunner` 投影 broker event
- `happy-server` / `ApiSessionClient` 同步到现有 Happy session
- `happy-app` 在 session 页消费既有 session events / metadata / agent state

因此：

- machine 页 discover DTO 只负责“能否选中并附着”
- session 页的 `approval pending`、运行状态和消息流统一来自已 attach 的 Happy session 事件
- session 页的身份锚点优先来自已 attach 的 Happy session metadata；不是来自 machine discover DTO

## 7. 机器页 Attach 信息架构

### 7.1 页面结构

机器页上的 broker attach 区改为两层结构：

1. `窗口组`
2. `组内 session 列表`

每个窗口组显示：

- 窗口 / 工作区主标题
- 次级元数据：短路径、最近活动时间、窗口序号、是否 active window
- 可选摘要标签：`2 sessions`、`1 degraded`、`Active Window`

窗口组标题渲染规则固定为：

1. 主标题优先使用 `windowLabel`
2. 若 `windowLabel` 为空，则回退到 `workspaceLabel`
3. 若二者都为空，则回退到 `Window N`
4. 次级信息优先显示 `workspaceLabel`；若它与主标题相同则不重复显示
5. `workspacePath` 只在以下情况显示：
   - 同名窗口需要去歧义
   - 用户展开查看详情

因此一个标准窗口组应表现为：

- 主标题：`api-repo.code-workspace`
- 次级信息：`~/work/api-repo · Window 1 · Active Window`

摘要计数口径固定为：

- `N sessions`：该窗口组下所有已发现 session，包含禁用但已展示的 `not_attachable`
- `M degraded`：该窗口组下 `attachable_with_degraded_capabilities` 的 session 数量，包含 `storage fallback / read_only_attach`
- `not_attachable` 不计入 `degraded`，如需表达则单独显示 `Unavailable`

短路径格式规则固定为：

- 优先显示 home-relative 路径，如 `~/work/api-repo`
- 若无法相对 home，则显示裁剪后的尾段路径
- 若 `workspacePath = null`，则退化为仅显示 `Window N`

### 7.2 组内 session 行

每条 session 行显示：

- 主标题：session title
- 右侧 provider pill：`Claude` / `Codex`
- 次文案：
  - attachability
  - 模式信息（`Runtime` / `Storage fallback`）
  - 关键降级信息

交互语义：

- `attachable` 与 `attachable_with_degraded_capabilities`：点击即 attach
- `not_attachable` 或 `degradedFlags` 含 `unstable_session_identity`：仍显示在原窗口组内，但行为为禁用，并展示原因文案；不允许点击 attach

禁用行的最小原因文案映射固定为：

| 条件 | 原因文案 |
|------|----------|
| `attachability = not_attachable` 且无更具体 degraded flag | `This live session is not attachable right now.` |
| `degradedFlags` 含 `unstable_session_identity` | `Session identity is unstable. Reopen or refresh VS Code before attaching.` |
| `degradedFlags` 含 `read_only_attach` | `Read-only attach only. You can inspect the session, but cannot send messages.` |
| `degradedFlags` 含 `attachment_bridge_unavailable` 且 session 被禁用 | `Attachment bridge is unavailable in this window.` |

规则：

- 若同时命中多条，优先级按表格从上到下取第一条
- `attachment_bridge_unavailable` 单独出现时，不会禁用 attach；只有它与更强的不可附着条件并存时，才作为原因文案候选

### 7.3 列表排序

v1 排序规则必须只依赖上文明确存在的字段，不能依赖未定义的 `latestSeq` 或未落地的 session 最近活动时间。

窗口组排序：

1. `Active Window`
2. `windowLastActiveAt` 较新者优先
3. `windowOrdinal` 较小者优先
4. `windowLabel` 字母序

如果 `windowLastActiveAt` 缺失，则直接跳过第 2 条。

组内 session 排序：

1. `attachable`
2. `attachable_with_degraded_capabilities`
3. `not_attachable`
4. 同一 attachability 下按 `provider` 字母序
5. 再按 `title` 字母序

v1 不要求按 `latestSeq` 或 session 最近活动时间排序；若后续需要更强活跃度排序，另起增量设计。

### 7.4 重名去歧义

若多个窗口出现相同 `workspaceLabel`：

- 先补 `Window 1 / Window 2`
- 如仍不足，补短路径

去歧义应发生在窗口级，不把冗长路径直接压进每条 session 行。

## 8. Session 页首屏与常驻状态

### 8.1 成功态节奏

attach 成功后进入 session 页，首屏节奏分两段：

1. `短暂展开态`
   - 明确告诉用户已接管成功
   - 显示当前 `provider + window/workspace`
   - 显示当前关键能力摘要
2. `折叠常驻态`
   - 在固定超时或首次交互后折叠
   - 变为贴着 Header 下方的轻量 strip

v1 折叠规则固定为：

- 初次进入 session 页时展示展开态
- 若 3 秒内没有交互，则在第 3 秒自动折叠
- 若先发生以下任一事件，则立即折叠并取消定时器：
  - 用户滚动正文超过 24px
  - 用户发送第一条消息
  - 收到第一段 assistant delta

优先级规则：

- 用户交互或首段 assistant delta 优先于定时器
- 折叠只发生一次；之后不自动重新展开

### 8.2 常驻 strip 信息

折叠后的 strip 只保留：

- 主信息：`Codex · api-repo.code-workspace`
- 副信息：`Window 1 · Runtime attached · interrupt + approval synced`

默认不把以下内容放进 strip：

- 长说明文案
- 详细 degraded 清单
- approval 操作按钮
- 多行 diagnostics

这里的 provider 文案来源固定为 session metadata 的 `flavor`；窗口文案来源固定为 `brokerWindowLabel / brokerWorkspaceLabel`。

### 8.3 再展开行为

点击 strip 可以展开 broker metadata 详情层，用于查看：

- 完整窗口身份
- provider extension
- capability / degraded 详情
- runtime vs storage 原因

字段来源固定为：

- `windowIdentity / provider / title / degradedFlags / modeReason / providerExtension`：来自已 attach session 的 metadata，其中窗口身份字段至少包含 `windowInstanceId / brokerWindowLabel / brokerWorkspaceLabel`
- `approval pending / run status`：来自既有 Happy session 事件
- 详情层不要求重新请求 machine discover DTO

详情层优先采用现有 session 信息体系的轻量扩展，而不是新增一个全新页面。

### 8.4 Session 页兼容策略

v1 必须兼容“attach 已成功，但 session metadata 仍缺少窗口锚点字段”的老版本组合。

当 session metadata 缺少以下任一字段时：

- `windowInstanceId`
- `brokerWindowLabel`
- `brokerWorkspaceLabel`

session 页的降级行为固定为：

- 不渲染常驻 strip
- 不渲染 broker 详情层入口
- 在正文顶部显示一条轻提示：`升级 CLI / bridge 后可显示 VS Code 窗口锚点`
- 不影响消息收发、approval、interrupt 等既有共控能力
- 页面绝不能因为缺字段而崩溃、闪退或进入空白态

如果 metadata 字段齐全，则按正常的 strip + 详情层路径渲染。

## 9. 即时状态与边界场景

### 9.1 Approval Pending

`approval pending` 作为正文上方的即时状态卡出现，不进入常驻 strip。

原因：

- approval 是短期动作，不是长期身份信息
- 常驻 strip 的职责是“我在控制谁”，不是“此刻待处理什么动作”

### 9.2 Storage Fallback

若当前 session 运行在 `storage`：

- attach 列表里明确显示 `Storage fallback` 或 `Storage attached`
- session 页 strip 副文案也保留这一状态
- 如果是只读附着，输入框必须禁用，并明确原因

### 9.3 Read-only Attach

若 attachability 退化到只读：

- 允许进入会话
- 但输入框不可用
- 页面明确告诉用户该 session 目前只能查看，不能发送消息或执行写操作

### 9.4 同窗双 Provider

同一窗口里的 `Claude` 与 `Codex` 必须始终视为两条独立 session。

表现为：

- attach 列表在同一窗口组内并列展示二者
- session 页 strip 必须包含 provider 名称
- 不允许只显示窗口名，否则会造成误判“正在控制同窗另一条 session”

### 9.5 多窗口同名 Workspace

若多个窗口拥有相同 workspace 名称：

- attach 列表以窗口级去歧义
- session 页 strip 也回退使用 `Window N` 或短路径补充说明

### 9.6 最小状态到 UI 映射表

为保证实现计划和测试边界一致，v1 采用下表作为最小映射规则：

| 条件 | Attach 列表 | Session strip | 正文即时状态 | 输入框 |
|------|-------------|---------------|--------------|--------|
| `attachability = attachable` 且 `effectiveMode = runtime` | 标准可附着 | `Runtime attached` | 无 | 启用 |
| `attachability = attachable_with_degraded_capabilities` 且 `modeReason = runtime_degraded` | 显示 `Degraded` 标签 | `Runtime degraded` | 仅在需要时显示细节 | 启用 |
| `effectiveMode = storage` 或 `degradedFlags` 含 `read_only_attach` | 显示 `Storage fallback` 或 `Read-only attach` | `Storage attached` / `Storage fallback` | 可显示只读说明 | 禁用 |
| `modeReason = storage_stale_selected` 或 `degradedFlags` 含 `stale_storage_state` | 显示 `Storage may be stale` | `Storage attached` | 显示数据可能过期说明 | 禁用 |
| `degradedFlags` 含 `interrupt_bridge_unavailable` | 降级标签 | 不写入主 strip，只在详情层可见 | 按需显示说明卡 | 启用 |
| `degradedFlags` 含 `approval_bridge_unavailable` | 降级标签 | 不写入主 strip，只在详情层可见 | 按需显示说明卡 | 启用 |
| `degradedFlags` 含 `attachment_bridge_unavailable` | 降级标签 | 不写入主 strip，只在详情层可见 | 可按需显示“附件仍留在 VS Code”说明 | 启用 |
| `degradedFlags` 含 `selection_context_stale` | 降级标签 | 不进入主 strip | 按需显示说明卡 | 启用 |
| `degradedFlags` 含 `unstable_session_identity` 或 `attachability = not_attachable` | 显示为禁用行，并解释原因 | 不适用 | 不适用 | 不适用 |
| broker run status = `waiting_approval` | 不适用 | 不进入主 strip | 显示 approval pending 卡 | 保持当前可用性，不额外禁用 |

其中：

- 主 strip 只承担身份锚点职责，不承担完整告警面板职责
- `approval pending` 是即时动作状态，不是长期身份状态
- `read_only_attach` 一旦出现，输入框必须禁用，不允许继续尝试发送消息
- `attachment_bridge_unavailable` 的语义固定为“附件桥接不可用，但文本消息、interrupt、approval 不因此失效”；它不是 attach 失败，也不是只读附着

## 10. 架构与改动边界

本次设计主要影响三层，但目标聚焦于 app 收口。

### 10.1 `happy-app`

职责：

- 呈现窗口分组 attach 列表
- attach 成功后展示展开态与折叠态 broker strip
- 呈现 approval / degraded / read-only 等即时状态

### 10.2 `happy-cli` machine RPC

职责：

- 为 app 提供可分组的 broker discover 数据
- 确保 attach 时返回的仍是稳定 `happySessionId`

要求：

- app 不能自行猜窗口身份
- 窗口分组所需字段必须由 machine RPC 明确提供

### 10.3 `happy-vscode-bridge`

职责：

- 暴露足够表达窗口归属的数据
- 不要求在本次设计里重做所有 broker instance 管理实现

要求：

- 如果当前 broker manifest / discover 结果尚未暴露窗口身份，实现计划必须先补这一前置能力

## 11. 测试策略

### 11.1 纯函数与格式化测试

覆盖：

- 窗口分组逻辑
- `windowLabel` / `workspacePath` 去歧义逻辑
- strip 主副文案拼接
- read-only / storage / degraded 标签生成

### 11.2 页面状态测试

覆盖：

- attach 列表渲染窗口组
- 同窗 `Claude` / `Codex` 并列展示
- attach 成功后展开态出现
- 超时、滚动、首次消息后折叠为 strip
- 点击 strip 展开详情
- read-only 时输入框禁用

### 11.3 边界场景测试

必须覆盖：

- 多窗口同名 workspace
- 同窗双 provider
- `attachable_with_degraded_capabilities`
- `storage fallback`
- `read_only_attach`
- `approval pending`
- session metadata 缺少窗口锚点字段时，strip 隐藏但会话仍可正常使用

### 11.4 流程测试

从机器页到 session 页的端到端流程至少验证：

1. 点击正确窗口组内的正确 session
2. attach 返回稳定 `happySessionId`
3. 跳转到正确会话
4. strip 显示正确的 provider + window/workspace
5. 不会把消息误发到同窗或异窗的其它 session

## 12. 实施切分建议

为了避免把 UI 设计直接撞到不完整的数据层，推荐按以下顺序实现：

1. 先补 broker window identity / instance discover 数据契约
2. 再改机器页 attach 列表为窗口分组
3. 再改 session 页的 attach 成功展开态与折叠 strip
4. 最后补边界状态与测试

这条顺序的原因是：

- 没有窗口身份，就不存在正确的分组 UI
- 没有分组 attach，就没有稳定的首屏身份锚点
- 没有稳定锚点，session 页再做视觉强化也会变成错误的确认

## 13. 结论

本次设计正式把 `happy-app` 的 broker attach 体验定义为：

> 以 `VS Code` 窗口 / 工作区为第一层信息架构，在组内展示 provider session；attach 成功后，以短暂展开确认 + 轻量常驻 strip 的方式持续表达当前控制目标，同时把聊天正文重新放回第一视觉层级。

这让 broker-backed session 在手机端不再只是“能点进去”，而是“能选对、能看懂、能长期共控”。
