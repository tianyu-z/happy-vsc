# VS Code Broker 全局发现与多实例附着设计

状态：已通过设计评审  
日期：2026-03-25  
关联文档：

- `docs/superpowers/specs/2026-03-23-vscode-companion-broker-design.md`
- `docs/superpowers/specs/2026-03-23-broker-wire-schemas-design.md`

## 1. 设计目标

本文是 `VS Code Companion Broker` 主设计的补充设计，专门解决以下问题：

- 同一 `Happy` 账号下，多个运行 `happy-cli` 的 machine 都可能安装并运行 `happy-vscode-bridge`
- 每台 machine 上可能同时存在多个 `VS Code` 窗口实例
- 每个窗口实例里可能各自有一个或多个可附着的 `Claude` / `Codex` live session
- 手机 `happy-app` 只有一个，但必须能看到所有 machine 上当前活跃的官方 `VS Code` live session
- 用户默认入口应是“全局活跃列表”，而不是“先选 machine，再看该 machine”

本文不重新定义 broker 的 provider attach 细节，而是补足：

- 多 machine、多窗口实例的身份模型
- manifest 与 heartbeat 生命周期
- daemon 如何汇总本机 broker inventory
- app 如何展示全局活跃列表
- attach 后如何映射为 Happy wrapper session

## 2. 设计结论

正式采用以下资源层级：

- `account`
- `machine`
- `bridgeInstance`
- `brokerSession`

正式采用以下用户体验：

- `happy-app` 默认显示跨所有 machine 的“全局活跃 VS Code live session 列表”
- `machine` 只作为归属信息与 attach 路由信息，不作为第一层导航
- discoverable broker session 与 attached Happy wrapper session 是两种不同资源，不能混用

正式采用以下实现策略：

- broker 优先运行在 `workspace extension host`
- 每个活跃窗口实例写出独立 manifest
- 每台 machine 的 `happy-cli daemon` 汇总本机 broker inventory
- 第一阶段把 inventory summary 写入 `machine.daemonState`
- app 从所有 machines 的 `daemonState` 扁平化得到全局活跃列表

## 3. 资源模型

### 3.1 machine

`machine` 表示运行 `happy-cli` / daemon 的那台机器。

它负责：

- 扫描本机 broker manifests
- 对本机 broker 做 discover / attach
- 向 Happy 服务端上报本机 broker inventory summary

它不直接代表 `VS Code` live session 的实际 runtime。

### 3.2 bridgeInstance

`bridgeInstance` 表示一个具体的 `happy-vscode-bridge` 活实例，通常对应一个 `VS Code` 窗口中的一个 broker 进程。

一个 machine 上可以同时存在多个 `bridgeInstance`。

`bridgeInstance` 必须携带：

- `installationId`
- `instanceId`
- `logicalWindowKey`
- `editorSessionId`
- `machineId`
- `windowLabel`
- `workspaceFolders`
- `runtimeKind`
- `runtimeLabel`
- `bridgeHostIps`
- `preferredHostIp`
- `runtimeIp`
- `brokerEndpoint`
- `brokerAuthToken`
- `providerKinds`
- `startedAt`
- `lastHeartbeatAt`
- `ttlMs`
- `status`

### 3.3 brokerSession

`brokerSession` 表示某个 `bridgeInstance` 当前 discover 到的一个可附着官方 live session。

它至少需要：

- `instanceId`
- `brokerSessionId`
- `provider`
- `title`
- `attachability`
- `capabilities`
- `degradedFlags`
- `lastActiveAt`
- `providerSessionKey`
- `messagePreview`

### 3.4 canonical key

`brokerSession` 的对外稳定键必须是：

- `canonicalSessionKey = machineId + ":" + instanceId + ":" + brokerSessionId`

约束如下：

- `providerSessionKey` 只能用于调试与 provider 内部追踪
- `canonicalSessionKey` 才是 app、daemon 和 wrapper session 的稳定引用
- IP 不参与主键，不参与 attach 路由

## 4. 身份与实例生命周期

### 4.1 installationId

`installationId` 在 bridge 插件第一次启动时生成并持久化。

用途：

- 标识这是一份固定的 bridge 安装
- 帮助区分同名 machine 恢复、复制工作目录等异常情况

### 4.2 instanceId

`instanceId` 在每次 extension host activation 时生成新的 UUID。

用途：

- 标识当前活实例
- 作为 attach 的第一路由键
- 避免使用 `pid`、端口等易漂移字段作为实例主键

### 4.3 logicalWindowKey

`logicalWindowKey` 通过以下信息做稳定哈希：

- `remoteName`
- `workspaceFolders`
- `extensionKind`
- provider host fingerprint

用途：

- 识别“这大概率是同一个逻辑窗口/工作区”
- 支持实例重启后的软去重

### 4.4 editorSessionId

`editorSessionId` 直接携带 `vscode.env.sessionId`。

用途：

- 调试与辅助排障
- 辅助判断实例是否经历过 editor restart

约束：

- 不作为实例主键
- 不作为 attach 路由键

## 5. Broker 必须运行在 workspace extension host

正式要求：

- broker 必须优先运行在 `workspace extension host`
- 不允许以 `UI host` 作为默认主路径

原因：

- 在 `SSH` / `WSL` / `dev container` 窗口中，workspace extension host 位于真实 runtime 所在机器
- manifest、broker endpoint 与 `happy-cli` daemon 因此落在同一台 machine 上
- 每台远端 machine 可以独立发现并上报自己的 broker sessions
- 这与“一个手机 app 看全局并集”的目标完全一致

## 6. Manifest 与 heartbeat

### 6.1 文件布局

每个活实例写一个独立 manifest：

- `~/.happy/bridges/vscode/instances/<instanceId>.json`

禁止共享单一 manifest 文件。

原因：

- 多窗口并发时，单文件一定互相覆盖
- 独立文件更容易做 stale 判断和僵尸清理

### 6.2 manifest 字段

manifest 至少包含：

- `installationId`
- `instanceId`
- `logicalWindowKey`
- `editorSessionId`
- `machineId`
- `windowLabel`
- `workspaceFolders`
- `runtimeKind`
- `runtimeLabel`
- `bridgeHostIps`
- `preferredHostIp`
- `runtimeIp`
- `providerKinds`
- `brokerEndpoint`
- `brokerAuthToken`
- `pid`
- `startedAt`
- `lastHeartbeatAt`
- `ttlMs`

### 6.3 heartbeat 频率

正式采用：

- bridge 每 `2s` 刷新一次 `lastHeartbeatAt`

daemon 侧判断规则：

- `10s` 无 heartbeat 视为 `stale`
- `60s` 以上 stale 的 manifest 做 best-effort 清理

### 6.4 退出与崩溃

bridge 在 deactivation 时应主动删除 manifest，但系统不能依赖这一步。

原因：

- `VS Code` 崩溃、extension host 被杀死时，manifest 可能残留
- stale 判断必须以 heartbeat 为准，而不是以文件存在为准

## 7. 重复实例与 shadowing

同一 machine 上可能出现两类重复：

- 用户真的开了两个相同 workspace 的窗口
- extension host 重启后旧 manifest 仍未清理

正式采用以下规则：

- 先按 `instanceId` 识别活实例
- 再按 `logicalWindowKey` 做软去重
- 同一 `logicalWindowKey` 下，取 `lastHeartbeatAt` 最新的实例作为主实例
- 其余实例标记为 `shadowed`

约束：

- `shadowed` instance 默认不进入 app 的全局活跃列表
- `shadowed` instance 仍应出现在 debug / inspect 输出中，便于排障

## 8. IP 字段设计

为了增强全局列表可识别性，正式加入 IP，但采用 best-effort 语义：

- `bridgeHostIps: string[]`
- `preferredHostIp?: string`
- `runtimeIp?: string`

语义如下：

- `bridgeHostIps`：运行 `happy-cli` / broker 的 machine 的可见 IP 列表
- `preferredHostIp`：从 `bridgeHostIps` 中选择最适合展示的地址
- `runtimeIp`：当前 workspace runtime 的 IP，仅在明确可得时填写

约束：

- IP 只用于展示和排障
- IP 不参与 identity
- IP 不参与 attach 路由
- 获取不到 IP 时必须允许为空

## 9. Daemon inventory 汇总

### 9.1 BrokerInventoryManager

每台 machine 的 daemon 内新增 `BrokerInventoryManager`，职责如下：

- 扫描本机 manifests
- 加载所有活着的 `bridgeInstance`
- 对每个 instance 执行 `discover`
- 构造本机 `brokerInventorySummary`

### 9.2 inventory summary 结构

第一阶段把 summary 挂入 `machine.daemonState`，至少包含：

- `updatedAt`
- `instances`
- `sessions`

`instances` 每项包含：

- `instanceId`
- `logicalWindowKey`
- `windowLabel`
- `runtimeKind`
- `runtimeLabel`
- `bridgeHostIps`
- `preferredHostIp`
- `runtimeIp`
- `lastSeenAt`
- `status`

`sessions` 每项包含：

- `canonicalSessionKey`
- `instanceId`
- `brokerSessionId`
- `provider`
- `title`
- `attachability`
- `capabilities`
- `degradedFlags`
- `lastActiveAt`
- `providerSessionKey`
- `messagePreview`

### 9.3 为什么第一阶段写入 daemonState

第一阶段不新增 server 独立资源表，原因：

- 复用现有 machine 同步链路即可打通 MVP
- app 已有跨 machine 读取 machine 状态的能力
- broker inventory 仍属于 machine-scoped 运行时信息

后续如果 inventory 规模或更新频率明显增大，再升级为 server 独立资源层。

## 10. App 的全局活跃列表

### 10.1 默认入口

app 必须新增独立入口：

- `Live Sessions`

它的默认行为是：

- 从所有 machines 的 `daemonState.brokerInventorySummary` 读取数据
- 扁平化为一个全局活跃列表
- 按 `lastActiveAt` 倒序排列

### 10.2 列表展示

每个列表项建议采用三行：

- 第一行：`provider badge + title`
- 第二行：`runtimeLabel`
- 第三行：`machineLabel · windowLabel · preferredHostIp`

### 10.3 过滤与搜索

MVP 需要支持：

- provider filter
- machine filter
- runtimeKind filter
- search

search 范围：

- `title`
- `windowLabel`
- `runtimeLabel`
- `preferredHostIp`

### 10.4 inspect 模式

每个条目应支持 `Inspect`，显示：

- `machineId`
- `instanceId`
- `logicalWindowKey`
- `brokerSessionId`
- `providerSessionKey`
- `runtimeKind`
- `runtimeLabel`
- `bridgeHostIps`
- `runtimeIp`
- `attachability`
- `degradedFlags`
- `lastSeenAt`

## 11. Attach 与 Happy wrapper session

### 11.1 discoverable session 与 attached session 必须分离

正式规定：

- discoverable broker session 不是 Happy 原生 session
- 用户执行 attach 之后，才创建或复用一个 Happy wrapper session

这两种资源不能混为一谈。

### 11.2 attach RPC

app 点击全局活跃项时，调用目标 machine 的 RPC：

- `broker-attach-session`

输入至少包含：

- `canonicalSessionKey`
- `instanceId`
- `brokerSessionId`

daemon attach 流程：

1. 先按 `instanceId + brokerSessionId` 精确 attach
2. 若实例已重启，则按 `canonicalSessionKey` 在当前 inventory 中重定位
3. 调用 broker 真正 attach
4. 创建或复用 Happy wrapper session
5. 返回 `happySessionId`

### 11.3 wrapper session 的稳定 tag

wrapper session 必须使用稳定 tag：

- `vscode-broker:<machineId>:<canonicalSessionKey>`

目的：

- 避免重复 attach 生成多个 wrapper session
- 允许多次打开同一 live session 时复用原会话
- 支持 bridge instance 重启后的稳定恢复

### 11.4 wrapper session metadata

wrapper session 必须明确带上 broker 来源字段：

- `transportKind: "vscode-broker"`
- `brokerMachineId`
- `brokerInstanceId`
- `brokerSessionId`
- `canonicalBrokerSessionKey`
- `runtimeKind`
- `runtimeLabel`
- `windowLabel`
- `preferredHostIp`
- `providerSessionKey`

约束：

- `flavor` 仍保持 `claude` 或 `codex`
- 依赖本地磁盘 session 的功能必须先判断 `transportKind !== "vscode-broker"`

## 12. 长驻 attach worker

daemon 内新增 `BrokerAttachedSessionRunner`，每个 attached wrapper session 对应一个 runner。

它负责：

- 持有 broker attach 连接
- 把 broker event 翻译成 Happy message / state 更新
- 把 app 发来的消息转成 broker `send`
- 把 interrupt / approval decision 转成 broker RPC
- broker 断线时把 wrapper session 标为 `detached` 或 `degraded`

正式职责划分：

- `BrokerInventoryManager` 负责 discoverable resources
- `BrokerAttachedSessionRunner` 负责 attached sessions

## 13. 错误与恢复

### 13.1 目标 session 已失效

attach 时若目标 broker session 已不存在，返回：

- `session_not_found`

app 行为：

- 提示 session 已失效
- 从全局活跃列表中移除或刷新

### 13.2 instance stale

attach 时若指定 instance stale，但同一 `canonicalSessionKey` 还能在 inventory 中重新匹配到，则允许自动重定位 attach。

### 13.3 wrapper session 仍在，但 broker 已断开

必须保留 wrapper session，但标记为：

- `detached`

并允许用户执行：

- `Reconnect`

### 13.4 degraded 能力

若 provider 某些能力暂时失效，应通过 `degradedFlags` 明确暴露，不允许静默降级。

## 14. CLI 与调试入口

为了便于桌面与终端排障，建议 CLI 增加：

- `happy broker list`
- `happy broker inspect <canonicalSessionKey>`

这两个入口不影响 app 主路径，但能显著提升多 machine、多窗口实例场景下的问题定位效率。

## 15. 测试策略

### 15.1 bridge 侧

- manifest 写入与 heartbeat
- stale 清理
- 多实例并发
- `logicalWindowKey` shadowing
- runtime 标签推导
- IP best-effort 获取失败

### 15.2 daemon 侧

- manifests 扫描
- inventory summary 投影
- `canonicalSessionKey` 稳定性
- stale / shadowed 过滤
- attach 时实例漂移后的重定位

### 15.3 fake broker 集成测试

- discover -> attach -> send -> interrupt -> approval -> events
- broker 重启后 reconnect
- session 消失后的错误处理
- 同窗 `Claude + Codex` 共存

### 15.4 app 侧

- 多 machine inventory 扁平化
- 排序 / 过滤 / 搜索
- shadowed instance 不展示
- attach 成功后跳转到 wrapper session
- `detached` / `degraded` 状态展示

## 16. rollout 计划

正式建议按以下顺序落地：

1. bridge 独立 manifest 与 `instanceId`
2. daemon inventory summary
3. app 全局只读 `Live Sessions` 列表
4. `broker-attach-session` 与 wrapper session 映射
5. 双向控制、断线恢复、`detached` / `degraded` 状态完善

## 17. 明确非目标

第一阶段明确不做以下事情：

- 不把 discoverable broker session 直接伪装成普通 Happy session
- 不用 IP 作为 identity 或 attach 路由
- 不在第一阶段要求 server 新增独立 broker 资源表
- 不支持跨 machine 迁移 attach
- 不允许用单一共享 manifest 覆盖多窗口实例

## 18. 最终结论

本设计把“同一个手机 app 统一查看并附着所有 machine 上的官方 VS Code Claude/Codex live session”正式收束为以下架构：

- broker 运行在 workspace extension host
- 每个窗口实例拥有独立 manifest、独立 `instanceId`
- daemon 汇总 machine-scoped broker inventory
- app 以全局活跃列表作为默认入口
- attach 后映射为带有 `vscode-broker` transport 标记的 Happy wrapper session

该方案满足：

- 多 machine
- 多窗口实例
- 多 provider
- 全局统一发现
- 稳定附着与恢复

同时不污染现有 Happy 原生 session 语义，并为后续 broker 独立资源化保留清晰升级路径。
