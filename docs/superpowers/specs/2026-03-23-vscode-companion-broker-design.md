# VS Code Companion Broker 设计

状态：已通过设计评审  
日期：2026-03-23

## 1. 背景

`Happy Next` 当前的核心工作流，是由 `happy-cli` 自己启动 Claude、Codex 或 Gemini 进程，然后通过本地 daemon、服务端和 Web/移动端实现远程同步与控制。

这条链路适合 `happy` 自己作为会话入口，但不满足新的核心需求：

- 会话必须先从官方 `VS Code` 插件启动
- 外部工具必须附着到这个已经存在的 live session
- 外部工具与 VS Code 必须共享同一上下文，而不是维护一份平行 twin session
- 第一阶段同时支持 `Claude Code` 与 `Codex`
- 第一阶段允许使用本地可观测的非公开接入方式，但架构必须保留未来切换到公开接口的替换层

## 2. 核心目标

本设计的目标是：

> 在不替代官方 Claude Code / Codex VS Code 插件的前提下，通过一个本地 VS Code companion broker，让外部 Happy-style 工具能够附着到官方插件已启动的同一 live session，并实现消息、工具调用、审批、中断、附件和编辑器上下文的完整共控。

## 3. 不可违反的约束

### 3.1 启动入口

第一阶段唯一合法入口是：

1. 用户先在官方 `Claude Code` 或 `Codex` 的 `VS Code` 插件里启动会话
2. 我们的外部工具再附着到这个已经存在的 live session

本阶段不支持由外部工具反向创建官方插件新会话。

### 3.2 同一会话，而不是镜像会话

系统必须围绕“同一 live session”的附着与共控设计，不能通过外部再起一份 twin session 规避问题。

### 3.3 完整共控

第一阶段的“协同”最低必须覆盖：

- 双向消息同步
- tool call / turn status 同步
- approval request / response 双向同步
- interrupt 双向同步
- 附件共享
- 当前 selection / active file / workspace context 共享
- 断线重连后的事件补齐

### 3.4 允许降级，但必须可见

当 provider 的私有接入点变化，某些桥接能力失效时，系统可以降级，但必须显式暴露为降级状态，不能静默失败。

## 4. 方案对比

### 4.1 方案 A：Shadow Attach

定义：

- 不建立正式 broker
- 主要依赖 terminal/pty、transcript、插件本地状态、命令链路去影子附着官方会话

优点：

- PoC 最快
- 代码改动最少

缺点：

- 难以稳定支撑完整共控
- approval / interrupt / attachments / selection 同步脆弱
- `Claude` 与 `Codex` 的统一抽象会非常不稳定

### 4.2 方案 B：Companion Broker

定义：

- 新增一个 `VS Code companion extension`
- 它作为本地唯一 broker，发现官方 live session，并向外部 Happy-style 工具暴露统一 attach API
- provider 私有逻辑封装在 `ClaudeAdapter` / `CodexAdapter`

优点：

- 真正满足“先在官方插件里启动，再附着同一 live session”
- 最适合承载完整共控
- provider 私有接入被关进 adapter，可替换性最好
- 可以与现有 `happy spawn` 路径并存，不破坏当前主链路

缺点：

- 第一版需要新建 bridge package
- 需要定义 broker 协议、snapshot、event log
- 实现复杂度明显高于 Shadow Attach

### 4.3 方案 C：Twin Session

定义：

- 外部工具维护一份平行会话
- 尽量把官方插件会话内容镜像进去，再做同步

优点：

- 外部 API 可以最规整
- provider 适配层理论上最统一

缺点：

- 本质不是附着同一会话
- 上下文漂移是结构性问题
- 直接违背核心需求

### 4.4 结论

正式采用 `方案 B：Companion Broker`。

## 5. 顶层边界与角色

### 5.1 官方插件

官方 `Claude Code` / `Codex` 插件继续拥有真实的 live session。  
它负责实际模型对话、工具执行、IDE 内联上下文和编辑器体验。

### 5.2 VS Code Companion Extension

companion extension 是唯一的本地 broker。  
它不拥有主会话，只做以下事情：

- 发现官方插件里已存在的 live session
- 暴露稳定的本地 attach API
- 统一抽象 editor context、selection、附件、审批、中断、运行状态
- 在 provider 私有实现变化时提供隔离层

### 5.3 外部 Happy-style 工具

外部工具只连接 broker，不直接碰官方插件。

### 5.4 Provider Adapter

provider 私有实现都在 companion extension 内部：

- `ClaudeAdapter`
- `CodexAdapter`

这两层优先走公开接口；没有公开接口时，允许使用本地可观测的非公开接入方式。

### 5.5 会话所有权与共享状态

需要明确区分：

- 会话所有权：官方插件 live session
- 协同真相源：broker 维护的 `Shared Session State`

`Shared Session State` 不是另一份平行会话，而是对同一会话的共享控制视图。

## 6. Companion Extension 内部模块

建议在 bridge package 内部拆分为以下模块：

### 6.1 SessionDiscoveryService

负责发现当前 `VS Code window / workspace` 中可附着的官方 live session，并输出统一的 `DiscoveredSession`。

### 6.2 ProviderAdapterHost

负责装载和调度：

- `ClaudeAdapter`
- `CodexAdapter`

统一接口应至少包括：

- `discover()`
- `attach(providerSessionRef)`
- `sendMessage()`
- `interrupt()`
- `resolveApproval()`
- `captureEditorContext()`
- `watchEvents()`
- `getCapabilities()`

### 6.3 SharedSessionStore

负责：

- append-only event log
- snapshot projection
- `seq` 分配
- 广播订阅

它是 broker 的中心，不允许 provider adapter 直接改 UI state。

### 6.4 BrokerTransport

负责：

- loopback WebSocket / JSON-RPC
- token 校验
- 外部客户端 attach / detach
- 事件推送

### 6.5 EditorContextBridge

负责从 `VS Code` 统一抽取：

- active file
- selected text
- selection ranges
- visible files
- open tabs
- workspace roots
- git branch
- diagnostics summary

### 6.6 ArtifactBridge

负责：

- 图片/文件附件
- 临时文件引用
- patch/diff 产物

需要和 editor context 分模型管理。

### 6.7 Health / Compatibility Registry

负责记录每个 provider 当前桥接健康度，例如：

- discovery 正常
- live stream 正常
- approval 正常
- interrupt 正常
- attachments 降级

## 7. Broker 协议

### 7.1 标识体系

必须区分两个 ID：

- `providerSessionRef`：官方插件内部会话标识，对外保持 opaque
- `brokerSessionId`：broker 为已发现 live session 签发的稳定 UUID

外部工具永远只依赖 `brokerSessionId`。

### 7.2 传输层

第一阶段采用：

- `loopback WebSocket`
- `JSON-RPC`

原因：

- 需要双向流式事件
- companion extension 与外部 daemon / CLI 对接简单
- 后续 Happy 本地 daemon 容易复用和转发

为了发现 broker 地址，companion extension 写出本地 manifest，例如：

- `~/.happy-vsc/broker/instance.json`

manifest 至少包含：

- broker 版本
- 监听地址
- 短期 token
- window / workspace 标识

### 7.3 核心 RPC

第一阶段统一暴露这些 RPC：

- `discoverSessions`
- `attachSession`
- `detachSession`
- `sendUserMessage`
- `interruptTurn`
- `respondToApproval`
- `pushAttachment`
- `updateEditorContext`
- `getSnapshot`
- `subscribeEvents`

### 7.4 Capability 与降级声明

`snapshot` 和 discovery 结果中都要显式包含：

- `capabilities`
- `degradedFlags`

典型降级项：

- `read_only_attach`
- `approval_bridge_unavailable`
- `attachment_bridge_unavailable`
- `selection_context_stale`

## 8. Shared Session State 模型

### 8.1 事件优先

`Shared Session State` 不应直接维护为可变对象，而应由 append-only event log 投影得到。

### 8.2 统一事件类型

第一阶段至少覆盖：

- `session.discovered`
- `session.attached`
- `message.user_submitted`
- `message.assistant_delta`
- `message.assistant_completed`
- `tool.call_started`
- `tool.call_updated`
- `tool.call_completed`
- `approval.requested`
- `approval.resolved`
- `turn.interrupted`
- `attachment.added`
- `editor.selection_changed`
- `workspace.context_changed`
- `provider.status_changed`
- `sync.degraded`

### 8.3 Snapshot 字段

`snapshot` 至少包含：

- `brokerSessionId`
- `provider`
- `providerSessionRef`
- `workspace`
- `participants`
- `capabilities`
- `latestSeq`
- `turnState`
- `messages`
- `pendingApprovals`
- `activeTools`
- `editorContext`
- `attachments`
- `degradedFlags`

### 8.4 一致性策略

所有客户端只能提交 `intent`，不能直接改 provider session。  
真正的写入由 broker 单写队列串行执行，并为每条 intent 分配：

- `seq`
- `origin`

这是避免 VS Code 与外部工具双写冲突的核心。

## 9. 会话生命周期与状态机

### 9.1 发现

当官方插件先启动会话后，companion extension 观察到 live session，并创建：

- `provider`
- `providerSessionRef`
- `brokerSessionId`
- `state = discovered`

### 9.2 可附着性检查

发现后不能立即 attach，需要检查：

- live stream 是否可观察
- 当前 turn 状态是否可读
- editor/workspace scope 是否匹配
- approval / interrupt 通道是否可用

输出三类结果：

- `attachable`
- `attachable_with_degraded_capabilities`
- `not_attachable`

### 9.3 外部 attach

外部 Happy-style 工具流程：

1. 调用 `discoverSessions`
2. 选择 `brokerSessionId`
3. 调用 `attachSession(brokerSessionId)`

attach 成功后 broker 返回：

- 当前 `snapshot`
- `capabilities`
- `degradedFlags`
- 一个从 `latestSeq + 1` 开始的事件流订阅

### 9.4 Mirror Phase

attach 后先进入 `attached_syncing`，先做镜像对齐：

- 最近消息
- 当前 turn 状态
- active tools
- pending approvals
- editor context
- attachments
- cwd / workspace context

镜像完成后才进入 `attached_live`。

### 9.5 Attached Live

处于 `attached_live` 时：

- VS Code 侧与外部工具都可以发动作
- 但动作必须先进入 broker 的 `intent queue`
- broker 串行落地到 provider session

### 9.6 Turn 状态

统一投影为以下状态：

- `idle`
- `submitting`
- `running`
- `awaiting_approval`
- `interrupted`
- `completed`
- `failed`
- `degraded_running`

### 9.7 审批与中断

approval 和 interrupt 必须是 first-class shared controls。

规则：

- provider 发出 approval request 后，broker 生成唯一 `approvalId`
- VS Code 和外部工具都能看到该请求
- 任一端响应后，broker 封口，重复响应全部拒绝
- 任一端都可以发出 `interrupt intent`

### 9.8 上下文与附件注入

编辑器上下文与附件使用“显式注入”原则：

- selection 变化会更新 shared state
- 真正发送消息时，只有明确声明要携带的上下文/附件才会注入 provider session

避免隐式、持续、全量污染上下文。

### 9.9 断连与恢复

第一阶段支持两类恢复：

1. `external client reconnect`
   外部工具断开后重连同一 `brokerSessionId`，通过 `seq` 补事件

2. `broker restart while provider session survives`
   companion extension 重启后，重新发现 live session，并尽量恢复原有 `brokerSessionId` 映射

第一阶段不承诺 VS Code 全重启后 100% 恢复 attach 关系，但架构必须预留恢复点。

## 10. Repo 落点

### 10.1 新增 package：`packages/happy-vscode-bridge`

该 package 承载：

- companion extension 本体
- `ClaudeAdapter` / `CodexAdapter`
- broker server
- `SharedSessionStore`
- `EditorContextBridge`
- `ArtifactBridge`

### 10.2 扩展 `packages/happy-wire`

新增共享 schema：

- `brokerSession`
- `brokerEvent`
- `brokerSnapshot`
- `brokerCapabilities`
- `brokerDegradedFlags`
- `editorContext`
- `artifactRef`
- `providerIntent`

### 10.3 调整 `packages/happy-cli`

新增 `broker client` 能力，但不在 `happy-cli` 内承载 broker 本体。

`happy-cli` 第一阶段职责：

- 发现本机 broker manifest
- attach 到 broker
- 把 broker-backed session 映射到 Happy 的远程 session 模型
- 转发消息、审批、中断、附件
- 处理断连重连

### 10.4 调整 `packages/happy-server`

服务端只感知：

- 存在一种 `broker-backed session`
- 它的 metadata / state / capability / degradedFlags 如何同步

服务端不感知 provider 私有接入差异。

### 10.5 调整 `packages/happy-app`

第一阶段只新增 `attach 视图`，不新增“从 app 启动官方插件会话”的入口。

### 10.6 Session Source

需要在 Happy session metadata 中明确区分：

- `source = happy_spawned`
- `source = broker_attached`

## 11. 第一阶段范围

### 11.1 包含

第一阶段 MVP 包含：

- `Claude Code` 与 `Codex`
- 单个 `VS Code window scope`
- 单个外部 attach client
- 双向消息同步
- tool call / turn status 同步
- approval / interrupt 双向同步
- 附件共享
- selection / active file / workspace context 共享
- 断线重连后的 `seq` 补齐
- degraded mode 可见化
- 从 `happy-app/web` 附着到 broker-backed session

### 11.2 不包含

第一阶段明确不做：

- broker 反向创建官方插件新会话
- 多 VS Code window 聚合
- 多外部客户端并发共控
- 离线缓存后再回放到官方 live session
- 完美恢复所有 provider 私有上下文
- 跨 provider 会话迁移
- `Gemini`

## 12. 风险与缓解

### 12.1 私有接入点变动

风险：`Claude` / `Codex` 官方插件可能修改内部行为。  
缓解：所有 provider 依赖都封装在 adapter 内，并通过 `Health / Compatibility Registry` 显式上报降级。

### 12.2 双写冲突

风险：VS Code 与外部工具同时写 session，导致消息顺序漂移。  
缓解：所有动作都先转为 `intent`，由 broker 单写队列串行落地。

### 12.3 附件与上下文污染

风险：attach 后自动注入大量 IDE 上下文，污染真实对话。  
缓解：使用显式注入模型，只在消息发送时注入被选择的上下文。

### 12.4 恢复一致性

风险：broker 重启后，live session 仍存在，但 attach 映射丢失。  
缓解：为 `providerSessionRef -> brokerSessionId` 保留恢复映射，并在恢复失败时显式失效旧 attach，而不是静默漂移。

## 13. 后续步骤

设计批准后的后续流程：

1. 写 implementation plan
2. 先搭建 `happy-vscode-bridge` 骨架与 broker 协议
3. 再做 `ClaudeAdapter` / `CodexAdapter`
4. 最后接入 `happy-cli`、`happy-server`、`happy-app`

本 spec 的结论是：  
`Happy Next` 应新增一条与现有 `happy spawn` 并行的 `broker-attached backend`，并以 `VS Code companion broker` 作为第一阶段统一支持官方插件 live session attach 的核心架构。
