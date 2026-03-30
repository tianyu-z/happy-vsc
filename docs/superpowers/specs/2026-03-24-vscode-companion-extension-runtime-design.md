# VS Code Companion Extension Runtime 设计

状态：设计已通过，待文档审阅  
日期：2026-03-24

## 1. 背景

现有 `VS Code Companion Broker` 设计已经定义了 broker、adapter、wire protocol 和 Happy 侧 attach 流程，但 `packages/happy-vscode-bridge` 当前仍停在 broker stub 阶段：

- broker 可以启动
- `ClaudeAdapter` / `CodexAdapter` 已存在
- `extension.ts` 仍使用空的 `adapterHost`
- package 还不是可 `F5` 启动、可打包安装的正式 `VS Code extension`

因此，本次子项目的目标不是重做 broker，而是在既有 companion broker 架构上补齐 `VS Code extension runtime`，让它能够在同一 `VS Code` 窗口中发现官方 `Claude` / `Codex` live session，并把这些 session 以统一 attach API 暴露给 Happy。

## 2. 目标

本次设计要解决以下问题：

1. 让 `happy-vscode-bridge` 成为真正的 `VS Code extension`
2. 支持 `F5 -> Extension Development Host` 本地调试
3. 支持打包为 `.vsix`
4. 发现当前 `VS Code window / workspace` 中已经由官方 `Claude` / `Codex` 扩展启动的 live session
5. 允许 Happy attach 到同一个 live session，而不是镜像 twin session
6. 在 `RuntimeProbe` 不可用时，自动 fallback 到 `StorageProbe`
7. 在 `RuntimeProbe` 恢复时，自动回弹到推荐路径
8. 对外保持稳定的 `brokerSessionId`

## 3. 非目标

本次设计不包含以下内容：

- 从 Happy 直接创建新的官方插件会话
- 发现其他 `VS Code` 窗口中的 session
- 聚合多窗口、多机器或多用户的 session
- 支持 `Gemini`
- 承诺兼容所有历史或未来版本的官方扩展

## 4. 已确认约束

### 4.1 接入策略

采用“`A 主路径 + B 回退`”：

- 主路径：`RuntimeProbe`
- 回退：`StorageProbe`

系统优先通过当前 `VS Code` 进程内的 runtime 观察与动作桥接来实现 full-control attach。  
当 runtime 层拿不到发现、元数据或控制桥时，允许回退到读取本地状态的 storage 路径。

### 4.2 私有接入边界

采用“公共优先，必要时允许更深私有 probe”：

- 优先使用可观察的 `VS Code` 扩展 API、commands、context keys、exports
- 如果不足以完成 live session discovery / attach，允许 provider-specific 私有探测
- 私有细节必须封装在 provider probe 内，不能泄漏到 broker 协议

### 4.3 发现范围

第一阶段 discovery 只覆盖：

- 当前 `VS Code` 窗口
- 当前 `workspace`

### 4.4 Provider 目标

第一阶段必须同时支持：

- 官方 `Claude` `VS Code` 扩展
- 官方 `Codex` `VS Code` 扩展

两者都必须达到同等级 `full-control attach`；任一 provider 仅能 degraded attach 时，不视为本阶段完成。

### 4.5 Full-Control Attach 定义

`full-control attach` 在本子项目中有明确验收口径。  
一个 provider session 只有在以下能力全部可用时，才算 `full-control`：

| 能力 | 必须条件 | 缺失时结果 |
|------|----------|------------|
| `sendUserMessage` | 外部 Happy 发送的消息进入同一个官方 live session | `read_only_attach` |
| `interrupt` | 外部中断能进入同一个官方 live session，并收到确认事件或状态回写 | `interrupt_bridge_unavailable` |
| `resolveApproval` | 外部审批决定能进入同一个官方 live session，并收到确认事件或状态回写 | `approval_bridge_unavailable` |
| `watchEvents` | broker 能持续收到 live session 的消息/turn/approval/interrupt 相关事件 | `event_stream_unavailable` |
| `captureEditorContext` | 能提取当前 editor context，至少包括 active file、selection、workspace roots、diagnostics summary | `selection_context_stale` |
| `attachments` | provider 附件/产物能被 broker 发现并共享为 artifact/attachment 引用 | `attachment_bridge_unavailable` |

`watchEvents` 的最小事件集合包括：

- 用户消息追加
- assistant 消息追加
- turn / run status 变化
- approval request 出现
- approval resolved / dismissed
- interrupt 请求或执行结果回写

只要上表中任一能力缺失，该 session 就只能标记为 `attachable_with_degraded_capabilities`，不能记为 `full-control attach`。

### 4.6 兼容范围

第一阶段只承诺支持开发期间验证过的“当前最新版”官方扩展。  
系统会暴露真实 `providerExtension.id` 与 `providerExtension.version`，但不会在本阶段写死公开的版本区间策略。

## 5. 模式模型

### 5.1 两种内部模式

系统内部存在两种 attach 模式：

- `runtime`
- `storage`

它们不是两个独立产品流程，而是同一个 companion attach 流中的两种实现路径。

### 5.2 手动切换与自动回弹

每个 live session 都维护一组独立模式状态：

- `desiredMode`
  - `runtime_preferred`
  - `storage_preferred`
- `effectiveMode`
  - `runtime`
  - `storage`

用户可以对每个 session 手动切换偏好模式。  
UI 必须明确将 `RuntimeProbe` 标记为 `Recommended`。

自动行为规则：

1. `desiredMode = runtime_preferred` 且 `RuntimeProbe` 可用时，`effectiveMode = runtime`
2. `desiredMode = runtime_preferred` 且 `RuntimeProbe` 不可用时，自动 fallback 到 `storage`
3. `desiredMode = storage_preferred` 且 `StorageProbe` 可用时，`effectiveMode = storage`
4. `desiredMode = storage_preferred` 但 `StorageProbe` 不可用、`RuntimeProbe` 可用时，自动回弹到 `runtime`
5. 当 `RuntimeProbe` 恢复且它满足当前 `desiredMode` 的优先条件时，系统自动回到 `runtime`

切换与回弹只更新模式与能力，不重建 session 身份。

### 5.3 模式能力边界

- `runtime` 是推荐路径，也是 full-control attach 的唯一主路径
- `storage` 用于 discovery、metadata 和降级 attach
- 如果只有 `StorageProbe` 可用，默认仅暴露 `read-only/degraded` 能力
- 若某 provider 将来存在可被证明安全的 storage 写桥，可在 provider 内单独扩展，但本设计不默认开放

### 5.4 Probe Health 与可用性判据

probe health 不是抽象标签，而是明确的实现判据。

#### RuntimeProbe

`runtimeHealth` 有三档：

- `ready`
- `degraded`
- `unavailable`

判定规则：

- `ready`
  - 目标 provider 扩展已安装且已激活
  - session 可由 runtime 路径发现
  - `sendUserMessage`、`interrupt`、`resolveApproval`、`watchEvents`、`captureEditorContext`、`attachments` 所需桥接入口都存在
  - 事件订阅在超时窗口内建立成功
- `degraded`
  - session 可由 runtime 路径发现
  - 但 full-control 所需桥接入口缺失一项或多项
  - 或事件订阅建立失败但其他 runtime 桥仍可用
- `unavailable`
  - provider 扩展未安装、未激活或初始化失败
  - 或 session 无法由 runtime 路径发现
  - 或 runtime 探测在超时窗口内失败

其中“桥接入口存在”的最低判据是：

- 对应 exports / commands / context-backed runtime hook 已被解析
- provider-specific probe 已完成非破坏性 smoke check

这里的 smoke check 必须是只读或无副作用检查，不能发送真实消息、中断或审批。

#### StorageProbe

`storageHealth` 有三档：

- `ready`
- `stale`
- `unavailable`

判定规则：

- `ready`
  - 目标 provider 的 storage/state 可读取、可解析
  - 找到与当前 workspace 匹配的 session 记录
  - 记录时间戳处于 freshness 窗口内
- `stale`
  - storage 记录可读取、可解析
  - 但时间戳已超出 freshness 窗口，或缺少必要 freshness 证据
- `unavailable`
  - 无法找到可读取的 storage
  - 解析失败
  - 找不到与当前 workspace 匹配的 session 记录

第一阶段默认 freshness 窗口为最近 `60s` 内有更新时间戳或 provider heartbeat。

#### 模式切换节流

为避免 probe 抖动导致 UI 和 attach 状态来回跳变：

- 非致命健康状态变化，必须在连续 `2` 次采样中得到相同结果才生效
- `runtime -> storage` 自动 fallback 发生后，至少等待 `5s` 再允许自动回弹
- provider 明确发出的“session ended / disconnected”属于致命事件，可立即切换状态

`SessionModeResolver` 必须实现以上节流规则。

## 6. 顶层架构

本次采用 `Unified Session Runtime` 架构。

### 6.1 Extension Shell

负责：

- `VS Code extension` 激活与停用
- 写出 broker manifest
- 注册 commands、tree view、status bar
- 启动 `BrokerServer`

### 6.2 ProviderHostRegistry

负责发现当前窗口中目标 provider 扩展的：

- extension `id`
- version
- activation status
- 可观察 commands / exports / context keys
- provider-specific runtime hooks 是否存在

### 6.3 RuntimeProbe

职责：

- 发现真实 live session
- 读取当前 live runtime 元数据
- 暴露 send / interrupt / approval 等动作桥
- 暴露事件流订阅能力

`RuntimeProbe` 优先使用公共观察入口；若不足，再走 provider-specific 私有探测。

### 6.4 StorageProbe

职责：

- 只读读取 provider 本地持久化状态
- 补 session discovery
- 补 title / latestSeq / 恢复信息
- 在 runtime 不可用时提供降级 attach 支撑

### 6.5 ProviderSessionNormalizer

负责把 `RuntimeProbe` 和 `StorageProbe` 的发现结果归一成同一个 provider 内部 session 身份，避免模式切换时把同一 live session 识别成两个对象。

归一流程必须显式包含：

1. 提取 runtime / storage 两侧证据
2. 计算统一 `workspaceIdentity`
3. 匹配 conversation identity / record identity
4. 生成稳定 `providerSessionKey`
5. 若证据不足以稳定归一，则将该 session 标记为 `unstable_session_identity`

### 6.6 SessionModeResolver

负责为每个 session 计算：

- `desiredMode`
- `effectiveMode`
- `modeReason`
- `capabilities`
- `degradedFlags`
- probe health 摘要

### 6.7 UnifiedSessionRuntimeStore

负责保存每个 session 的统一状态：

- 稳定 `brokerSessionId`
- provider refs
- 当前模式
- capabilities
- degraded flags
- probe health
- 兼容性信息

### 6.8 AdapterFacade

负责将统一 session runtime 映射为现有 adapter 所需接口：

- `liveSource`
- `metadataSource`
- `actions`

再将其注入：

- `ClaudeAdapter`
- `CodexAdapter`
- `ProviderAdapterHost`

broker server 仍只面向统一后的 adapter host，不直接感知 probe 细节。

## 7. Session 身份模型

### 7.1 providerSessionKey

系统为每个 provider 内部 session 生成 `providerSessionKey`。  
该值仅在 companion extension 内部使用，不对外暴露。

生成流程是明确算法，不是自由拼接。

#### 第一步：计算 `workspaceIdentity`

`workspaceIdentity` 的优先级如下：

1. 如果存在 `.code-workspace` 文件，取 `workspace-file:<workspaceFileUri>`
2. 如果是单根工作区，取 `folder:<folderUri>`
3. 如果是多根工作区但没有 workspace file，取 `multiroot:<sortedFolderUriList>`

补充规则：

- URI 统一使用 `vscode.Uri.toString()` 结果
- Windows 路径按大小写不敏感规则归一
- 如果存在 `remoteAuthority`，前缀写为 `remote:<remoteAuthority>|...`
- 远程类型如 `ssh` / `dev-container` / `wsl` 由 URI 与 `remoteAuthority` 一并编码

#### 第二步：提取 `conversationIdentity`

provider-specific normalizer 按以下优先级提取会话身份：

1. runtime 提供的稳定 `sessionId / threadId / conversationId`
2. storage 中能稳定映射到同一会话的 `conversationId`
3. storage `recordId`
4. transcript / state 文件中可稳定复现的唯一对象 id

如果以上证据都不存在，则该 session 不能获得稳定身份，必须标记：

- `unstable_session_identity`
- `attachability = not_attachable`

#### 第三步：合并 runtime / storage 证据

匹配顺序如下：

1. runtime 与 storage 的 `conversationIdentity` 一致，则视为同一 session
2. 若不一致，但已存在此前成功归一后的 alias 映射，按历史映射合并
3. 若 `workspaceIdentity + storage recordId` 只能唯一对应一个 runtime session，则允许合并
4. 若仍无法唯一确定，则不合并

#### 第四步：生成 `providerSessionKey`

规范化字符串格式为：

`v1|<providerExtensionId>|<workspaceIdentity>|<conversationIdentity>`

必要时允许在 provider 内附加只读辅助字段参与 alias 建立，但不能进入最终 key。

建议实现为：

- 内部保留原始 canonical string 便于调试
- `brokerSessionId` 生成时对 canonical string 做稳定哈希

### 7.2 brokerSessionId

`brokerSessionId` 对外暴露，且必须稳定。  
它由 `provider + providerSessionKey` 派生。

以下情况都不能导致 `brokerSessionId` 变化：

- `RuntimeProbe` 与 `StorageProbe` 之间切换
- fallback 与自动回弹
- capability 或 degraded flag 变化
- probeHealth 变化

## 8. 对外数据模型

broker 对外只暴露统一后的 session 事实，不暴露 probe 内部私有实现。

新增或扩展的外部字段包括：

- `desiredMode`
- `effectiveMode`
- `modeReason`
- `capabilities`
- `degradedFlags`
- `providerExtension`
  - `id`
  - `version`
- `compatibility`
  - `supported`
  - `unknown`
  - `incompatible`
- `probeHealth`
  - `runtime`
  - `storage`

其中：

- `desiredMode` 表示用户手动选择的偏好
- `effectiveMode` 表示当前实际生效路径
- `modeReason` 必须是可诊断的机器可读值
- `probeHealth.runtime` / `probeHealth.storage` 分别暴露对应 probe 的状态摘要

外部 Happy 侧只需要根据这些字段理解：

1. 这是哪个 `brokerSessionId`
2. 当前处于哪个实际模式
3. 当前具备哪些能力
4. 当前为何降级

## 9. VS Code Extension 表现层

本次不是单纯后台 broker，需要提供最小可用的 extension UI。

### 9.1 Commands

至少提供：

- 启动 broker
- 停止 broker
- 刷新 session discovery
- 对某个 session 切换 `desiredMode`

### 9.2 Tree View

展示当前窗口可附着 session 列表，并显示：

- provider
- title
- `RuntimeProbe (Recommended)` / `StorageProbe`
- 当前 `effectiveMode`
- attachability / degraded 状态

### 9.3 Status Bar

显示：

- broker 是否运行
- 已发现 session 数量
- 是否存在 degraded session

### 9.4 Session Detail

展示：

- `desiredMode`
- `effectiveMode`
- `modeReason`
- capabilities
- degraded flags
- provider extension version

## 10. 错误处理与降级

系统必须“显式降级，不静默伪成功”。

规则如下：

- 官方扩展未安装、未激活或结构无法识别：
  - 不进入 full-control attach
  - 标记 `compatibility = unknown` 或 `incompatible`
- `RuntimeProbe` 失败：
  - 自动 fallback 到 `StorageProbe`
  - 保留原 `brokerSessionId`
  - 写入明确 `modeReason`
- `StorageProbe` 数据过旧：
  - 仍可显示 session
  - 增加 `stale_storage_state`
- send bridge 缺失：
  - 增加 `read_only_attach`
- interrupt bridge 缺失：
  - 增加 `interrupt_bridge_unavailable`
- approval bridge 缺失：
  - 增加 `approval_bridge_unavailable`
- attachment bridge 缺失：
  - 增加 `attachment_bridge_unavailable`
- probe 异常：
  - 只影响当前 provider / 当前 session
  - 不允许拖垮整个 broker

## 11. 打包与调试

`packages/happy-vscode-bridge` 需要从普通 workspace package 升级为正式 `VS Code extension`，至少补齐：

- `engines.vscode`
- extension `main`
- `activationEvents`
- `contributes`
- `F5` 调试所需 launch/task 配置
- `.vsix` 打包流程

该 package 仍保留现有 monorepo package 身份与测试入口。

## 12. 测试策略

### 12.1 单元测试

覆盖：

- `ProviderSessionNormalizer`
- `SessionModeResolver`
- `brokerSessionId` 在模式切换前后保持稳定
- `capabilities` / `degradedFlags` 推导

### 12.2 Provider Probe 测试

分别覆盖 `Claude` 与 `Codex`：

- `RuntimeProbe`
- `StorageProbe`
- 当前最新版官方扩展 fixture 下的 live session discovery

### 12.3 Extension 集成测试

覆盖：

- `F5` 可起 `Extension Development Host`
- broker manifest 正常写出
- tree view / commands / mode 切换可用

### 12.4 端到端验证

至少验证：

1. 从官方 `Claude` 插件启动 live session
2. 从官方 `Codex` 插件启动 live session
3. companion 发现 session
4. Happy CLI / App attach 到同一个 `brokerSessionId`
5. `send / interrupt / approval / editor context` 两边一致
6. `RuntimeProbe` 失败时自动 fallback
7. `RuntimeProbe` 恢复时自动回弹

## 13. 完成标准

以下条件全部满足时，本子项目才算完成：

1. `packages/happy-vscode-bridge` 可作为正式 `VS Code extension` 运行
2. 可以通过 `F5` 启动 `Extension Development Host`
3. 可以打包为 `.vsix`
4. 在当前最新版官方 `Claude` 扩展上达到 full-control attach
5. 在当前最新版官方 `Codex` 扩展上达到 full-control attach
6. 每个 session 都支持手动切换 `desiredMode`
7. UI 明确标记 `RuntimeProbe (Recommended)`
8. `RuntimeProbe` 失败时自动 fallback 到 `StorageProbe`
9. `RuntimeProbe` 恢复时自动回弹
10. fallback / 回弹 / 模式切换不改变 `brokerSessionId`
11. Happy CLI / App 能正确消费新增模式与降级元数据
12. 所有新增 typecheck、单测、集成测试、验证脚本通过

## 14. 实施边界

本 spec 只覆盖 `VS Code companion extension runtime` 子项目。  
它不会重做现有 broker 协议，也不会重新设计 Happy 远程同步模型。

implementation plan 应建立在以下前提之上：

- 复用现有 `happy-wire` broker schema 与 protocol
- 复用现有 `happy-vscode-bridge` broker server 与 adapter host
- 通过新增 runtime / probe / UI / packaging 层补齐真正的 extension 能力
