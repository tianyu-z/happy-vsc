# Happy CLI Broker Relay 设计

状态：设计已通过，待文档审阅  
日期：2026-03-25

## 1. 背景

`happy-vscode-bridge` 当前已经基本打通了“本地 broker 层”：

- 能在 `ext-host` 更低层发现官方 `Claude` / `Codex` live session
- 能稳定暴露 `discover / attach / send / interrupt / approval / events` 这组 broker 接口
- diagnostics、degraded 判定和 `Codex recent 5` 残留问题已经基本收敛

但这还只是“本地附着层”。

当前仓库虽然已经有一些后续骨架，例如：

- `happy-cli` 中的 broker manifest 读取
- `happy-cli` 中的 broker RPC client
- daemon 里的 `broker-list-sessions` / `broker-attach-session`
- `happy-app` 机器页上的 broker attach 入口

这些能力仍然只覆盖“发现并发起附着”，没有完成“附着之后的持续双向控制”。

换句话说，现在缺的不是继续修 `happy-vscode-bridge` 本体，而是补齐 `happy-cli` 对本地 broker 的长期会话托管能力，让 Happy 的既有远程 session 模型可以承接一个已经存在于官方 `VS Code` 插件中的 live session。

## 2. 本次设计要解决的问题

本次设计的目标是：

> 让 `happy-cli` 能把一个已经存在的 `VS Code broker session` 映射成一个稳定的 `Happy session`，并通过现有 Happy 的 session 同步链路，把手机侧输入、live 文本输出、interrupt、approval 和 run status 与这个 broker session 做双向同步。

本次设计确认采用以下前提：

1. `1 个 machineId + 1 个 brokerSessionId = 1 个稳定的 Happy session`
2. 第一版完成线是：
   - 文本双向
   - 流式输出
   - interrupt
   - approval
   - run status
3. 当前阶段优先实现 `happy-cli` 内的 broker relay runner，而不是继续扩展 bridge 协议面

## 3. 非目标

本次设计明确不包含以下内容：

- 不从 Happy 侧创建新的官方 `VS Code` 插件会话
- 不做 broker event replay 或断线期间的历史补齐
- 不把 broker `tool` delta 还原成完整的 Happy tool-call / tool-result 卡片
- 不做附件打开、artifact 预览、editor context capture 的移动端交互闭环
- 不做图片输入转发到 broker
- 不处理多个移动端同时强一致共控同一 broker session 的复杂冲突语义
- 不把本地窗口级 broker 协议整体上抬为 server 中心协议

## 4. 为什么不选其它方案

### 4.1 方案 A：把 broker session 作为 machine RPC 特殊资源

定义：

- `happy-app` 直接围绕 machine RPC 调 broker
- 不映射成标准 Happy session

优点：

- 最直接
- 早期开发门槛低

缺点：

- 会在 Happy 内平行长出第二套会话体系
- 历史、同步、会话列表、权限动作、恢复逻辑都会分叉
- 后续很难再收敛回统一 session 模型

### 4.2 方案 B：由 `happy-cli` 托管 broker-backed Happy session

定义：

- `happy-cli` 启动一个常驻 relay
- relay 一边连接 Happy session，一边连接本地 broker
- 所有移动端控制都继续走现有 Happy session 通道

优点：

- 最大化复用现有 `happy-server` / `happy-app` / `ApiSessionClient` 模型
- attach 后天然进入标准 Happy session 生命周期
- 稳定映射、daemon 托管、手机端恢复都最自然

缺点：

- 需要设计一层 broker event 到 Happy session 的投影器
- 第一版要明确哪些事件先只做文本化投影

### 4.3 方案 C：server 直接托管 broker 协议

定义：

- `happy-cli` 只做薄代理
- `happy-server` 中心化承接 broker 状态和控制

优点：

- 长期看理论上更统一

缺点：

- 本地窗口级、短连接、实时性强的 broker 协议被强行提升为服务端协议
- 会明显增加时序、可靠性和实现复杂度
- 不适合第一版

### 4.4 结论

正式采用 `方案 B`：

> broker-backed session 在 Happy 中不是“第二套会话协议”，而是“标准 Happy session + broker relay 适配层”。

## 5. 核心约束

### 5.1 稳定身份映射

同一个 broker session 必须始终映射到同一个 Happy session。

推荐的稳定 tag 规则：

- `broker:<machineId>:<brokerSessionId>`

这意味着：

- 同一机器上重复 attach 不会新建 session
- daemon 重启后可以重新命中原 session
- 手机端重新进入时看到的仍是同一条会话

### 5.2 attach 的语义

`broker-attach-session` 的真实语义不应再是“创建一个只含 metadata 的 session 壳”，而应变成：

1. 确保这个 broker session 对应的稳定 Happy session 存在
2. 确保该 session 对应的 relay 进程已启动
3. 返回稳定的 `happySessionId`

### 5.3 v1 只保证最小控制闭环

第一版只要求这五类能力成立：

- 用户文本从手机发送到 broker session
- assistant 文本流回到手机
- run status 能反映到手机
- 手机可以 interrupt
- 手机可以 approve / deny 当前 broker approval

## 6. 顶层架构

本次设计引入四个清晰单元。

### 6.1 BrokerManifestResolver

职责：

- 在 `happy-cli` 中解析 `~/.happy-vsc/broker/instance.json`
- 产出可连接的 broker transport
- 在 broker 不可用时给出明确错误，而不是静默回退

它延续现有 `brokerManifest.ts` 的职责，不另造配置模型。

### 6.2 BrokerSessionIdentity

职责：

- 负责 `machineId + brokerSessionId -> Happy session tag`
- 为 broker-backed session 统一生成稳定 tag
- 为 daemon 的重复 attach / relay 重启提供唯一身份键

这一层必须是纯函数或近似纯函数，不能混入进程状态。

### 6.3 BrokerRelayRunner

职责：

- attach broker session
- 建立或恢复 Happy session
- 订阅 broker event stream
- 监听 `ApiSessionClient.onUserMessage(...)`
- 注册 session RPC handlers
- 执行双向翻译

它是本次设计的核心常驻进程。

### 6.4 BrokerEventProjector

职责：

- 把 broker event 投影成 Happy 已有能理解的 message / agentState / session event
- 维护去重和短时状态
- 避免把 broker 低层细节泄漏给 app

它不负责网络连接，只负责事件解释和状态投影。

## 7. Attach 流程

broker attach 的推荐时序如下：

1. `happy-app` 调 machine RPC `broker-attach-session`
2. daemon 检查是否已有该 `brokerSessionId` 对应的 relay
3. 如果已有且健康，直接返回其 `happySessionId`
4. 如果不存在或已失效，启动新的 `BrokerRelayRunner`
5. relay 连接 broker，执行 `attachSession`
6. relay 计算稳定 tag
7. relay 使用稳定 tag 调 `getOrCreateSession`
8. relay 建立 `ApiSessionClient`
9. relay 向 daemon webhook 报告 `happySessionId`
10. relay 执行 `subscribeEvents` 并进入长期运行

### 7.1 重复 attach 规则

重复 attach 同一个 broker session 时：

- 不新建 Happy session
- 不创建第二个 relay 进程
- 直接返回已有 `happySessionId`

若已有 relay 已死但 session 仍存在：

- 使用原稳定 tag 复用原 session
- 原地重启 relay

## 8. 入站消息流：手机到 broker

broker-backed session 复用现有 Happy session 输入链路：

- `happy-app`
- `happy-server`
- `ApiSessionClient.onUserMessage(...)`
- `BrokerRelayRunner`
- broker `sendMessage`

### 8.1 文本消息

对正常用户文本：

- 直接读取 `message.content.text`
- 调用 `broker.sendMessage(brokerSessionId, text)`

### 8.2 mixed 消息

对带图片的 `mixed` 消息：

- v1 只转发文本部分
- 图片内容不转发给 broker
- relay 追加一条轻量 service / event message，明确提示当前 broker v1 不支持图片转发

### 8.3 不做额外本地回显

用户消息本身已经通过 Happy session 进入时间线，因此 relay 不再额外制造一条新的“用户已发送”消息，避免双写。

## 9. 出站消息流：broker 到 Happy

relay 通过 broker `subscribeEvents` 持续消费 live notification，并将它们投影到 Happy session。

### 9.1 文本事件投影

#### assistant delta

`session.message.delta` 且 `role=assistant` 时：

- 投影为 ACP `message` 类型文本消息
- provider 使用 broker session snapshot 中的 provider 值

#### tool delta

`role=tool` 时：

- 第一版先按可见文本投影
- 不在 v1 中尝试还原为结构化 tool card

#### user delta

`role=user` 时：

- 先经过 echo suppression
- 若判断为 relay 刚刚代手机发出的同文本文字，则丢弃
- 否则按真实外部用户输入投影到 Happy session

这保证了：

- 手机发出的消息不会因为 broker 自己回显再次重复出现
- 若用户直接在 `VS Code` 内继续发消息，手机端仍能看到

### 9.2 run status 投影

broker `session.run.status` 到 Happy 的映射规则如下：

- `running`
  - `keepAlive(true, 'remote')`
- `waiting_approval`
  - `keepAlive(false, 'remote')`
  - agent state 中应存在对应 pending approval
- `idle`
  - `keepAlive(false, 'remote')`
- `completed`
  - `keepAlive(false, 'remote')`
  - 追加轻量完成事件
- `interrupted`
  - `keepAlive(false, 'remote')`
  - 追加中断事件
- `failed`
  - `keepAlive(false, 'remote')`
  - 追加失败事件与原因

同一状态重复到达时，不应重复写 agent state。

## 10. 控制面：interrupt 与 approval

本次设计明确复用 Happy 现有 session RPC 习惯，而不是新造一套 app 控制协议。

### 10.1 interrupt

移动端当前已有：

- `sessionAbort(sessionId)` -> session RPC `abort`

对于 broker-backed session：

- relay 在 `ApiSessionClient.rpcHandlerManager` 上注册 `abort`
- 收到后调用 broker `interruptSession(brokerSessionId, reason)`

### 10.2 approval

移动端当前已有：

- `sessionAllow(...)` -> session RPC `permission`
- `sessionDeny(...)` -> session RPC `permission`

对于 broker-backed session：

- relay 在 session RPC 上注册 `permission`
- 将 `approved=true` 映射为 broker `resolveApproval(..., 'approve')`
- 将 `approved=false` 映射为 broker `resolveApproval(..., 'deny')`

### 10.3 approval 在 app 中的呈现

为复用现有移动端 permission footer，relay 必须把 broker approval 请求投影到 `agentState.requests` / `completedRequests`：

- `session.approval.requested`
  - 写入 pending request
- `session.approval.resolved`
  - 从 pending 移到 completed
- `session.approval.dismissed`
  - 若 request 仍未完成，则标记为 canceled

v1 中 broker approval 不需要伪装成 provider 自己的复杂工具卡，只要能复用现有 permission action 流即可。

## 11. 恢复与可靠性

### 11.1 Happy session 恢复

Happy 侧恢复依赖稳定 tag。

relay 进程重启后再次调用：

- `getOrCreateSession(tag)`

必须命中原会话，而不是新建会话。

### 11.2 broker 连接恢复

broker socket 断开后，relay 进入重连循环。

重连成功后必须重新执行：

1. `attachSession`
2. `subscribeEvents`
3. 用最新 snapshot 刷新 metadata

### 11.3 daemon 恢复边界

daemon 只负责：

- 跟踪哪个 relay 进程活着
- 将 `brokerSessionId` 与 `happySessionId` 对齐

daemon 不负责持久化 broker event 历史。  
已经进入 Happy session 的消息才是最终历史。

### 11.4 明确不承诺的恢复能力

当前 broker 协议只有实时订阅，没有按 seq 回放接口，因此 v1 明确不承诺：

- 断线期间所有 delta 必须补齐
- 中间流式片段零丢失

v1 的恢复语义是：

- 已落入 Happy session 的消息保留
- 断线期间可能丢失部分中间流式增量
- 重连后从最新状态继续同步

## 12. 去重规则

### 12.1 会话级去重

- 同一 `machineId + brokerSessionId` 只允许存在一个活跃 relay
- 重复 attach 时直接复用现有 `happySessionId`

### 12.2 文本回显去重

relay 维护短时 `pending outbound echo` 集合：

- 记录最近成功发往 broker 的文本
- 收到 broker `role=user` delta 时进行短窗匹配
- 命中则丢弃，未命中则保留

### 12.3 approval 去重

- 以 `approvalId` 作为唯一键
- 相同 `approvalId` 的重复 requested 不重复写入 pending
- resolved / dismissed 只在目标 request 仍存在时迁移状态

### 12.4 status 去重

- 相同 run status 不重复写入状态
- 仅在状态变化时触发 keepAlive 语义更新和事件追加

## 13. 元数据与 UI 约定

broker-backed session 继续沿用已有 metadata 字段：

- `sessionSource = broker_attached`
- `brokerSessionId`
- `brokerCapabilities`
- `brokerDegradedFlags`
- `brokerDesiredMode`
- `brokerEffectiveMode`
- `brokerModeReason`
- `brokerCompatibility`
- `brokerProviderExtension`
- `brokerProbeHealth`

这些字段主要用于：

- machine 页 attach 列表展示
- session 信息页标注这是 broker-backed session
- 调试和问题定位

第一版不要求 app 为 broker session 设计全新 UI，只要求它在现有 session 页面中可被正常打开、看到文本流并触发控制动作。

## 14. 最小实现切片

建议按以下顺序实现：

### 14.1 切片 A：补齐 `BrokerClient` 能力

新增并测试：

- `interruptSession`
- `resolveApproval`
- `subscribeEvents`
- broker notification 解析

### 14.2 切片 B：稳定 session identity

新增：

- `BrokerSessionIdentity`
- 稳定 tag 生成
- attach 复用逻辑

### 14.3 切片 C：常驻 relay runner

新增：

- `BrokerRelayRunner`
- broker attach + subscribe 生命周期
- session `onUserMessage` 到 broker `sendMessage`
- session RPC `abort` / `permission`

### 14.4 切片 D：event projector

新增：

- message delta 投影
- approval 状态投影
- interrupt 事件投影
- run status 到 keepAlive / event 的映射

### 14.5 切片 E：daemon attach 复用

补齐：

- `brokerSessionId -> relay` 复用检查
- relay 死亡后的 attach 重启

## 15. 最小测试面

### 15.1 BrokerClient

必须覆盖：

- `interruptSession`
- `resolveApproval`
- `subscribeEvents`
- `brokerEvent` notification 解析

### 15.2 Session identity / attach

必须覆盖：

- 稳定 tag 生成
- 重复 attach 不新建 session
- relay 死亡后 attach 复用原 session 并重启 relay

### 15.3 Relay projector

必须覆盖：

- `session.message.delta`
- `session.run.status`
- `session.approval.requested / resolved / dismissed`
- `session.interrupt`

### 15.4 App / daemon integration

必须覆盖：

- machine attach 返回已有 session
- `sessionAbort` 能命中 broker-backed session
- `sessionAllow / sessionDeny` 能命中 broker-backed session

### 15.5 端到端假集成用例

推荐至少保留一个完整主链路测试：

1. attach broker session
2. 手机发文本
3. broker 推 assistant delta
4. broker 请求 approval
5. 手机 approve
6. broker run status completed

只要这个用例稳定通过，第一版主链路就已经具备验收价值。

## 16. 验收标准

当以下条件全部成立时，第一版视为完成：

1. 在机器页可以看到当前窗口中的 attachable broker session
2. attach 同一 broker session 多次，始终进入同一 Happy session
3. 手机侧发送文本后，官方 `VS Code` live session 收到该消息
4. live assistant 文本输出能持续回到手机
5. 手机侧能 interrupt 当前 broker run
6. 手机侧能 approve / deny 当前 broker approval
7. daemon 或 relay 重启后，仍可恢复到同一 Happy session 继续控制
8. 任何 attachment、tool delta、editor context 等未实现能力，都必须以“未实现”或“降级”显式暴露，不能伪装成完整支持

## 17. 开放问题

本设计故意保留以下问题到后续子项目，而不在本阶段解决：

- broker event 是否需要未来补 `seq after` 回放接口
- broker `tool` delta 如何映射成 Happy 的结构化工具卡
- 附件与 artifact 在移动端的打开、预览与下载语义
- editor context 是否需要进入移动端显式展示与附加发送
- 多移动端同时控制同一 broker session 时的冲突仲裁

这些问题都应在第一版稳定闭环跑通后，再单独进入下一轮 spec。
