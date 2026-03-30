# Happy App Android Broker P0 设计

状态：设计已通过，待文档审阅  
日期：2026-03-29

## 1. 背景

`packages/happy-app` 已经是完整的 `Expo + React Native` 客户端，不是待补源码的壳子。当前仓库内已经存在：

- Android 构建脚本与 Expo 配置
- 机器详情页中的 broker session 发现与 attach 入口
- broker-attached session 的会话页展示与输入组件
- broker list / attach 的基础测试

因此，本次工作的目标不是“从零做一个安卓 app 来控制 VS Code 插件”，而是：

> 在现有 `happy-app` 基础上，把 web UI 已经验证过的 `broker session -> attach -> session chat` 能力补齐到安卓 P0 可用闭环。

用户当前的真实目标也已经收敛为：

1. 确认仓库内已经包含 app 源码
2. 不重做 app 架构
3. 第一阶段只完成手机端控制 VS Code 插件的核心闭环
4. 同时兼容 `self-host` 与官方线上环境

## 2. P0 目标

本次 P0 只交付一条最小但完整的安卓闭环：

1. 用户能在手机上看到 machine
2. 用户能看到该 machine 下可 attach 的 `VS Code Companion Sessions`
3. 用户点击 `Attach` 后能稳定进入对应 session
4. 用户在手机中发送消息后，VS Code 插件侧真实收到并执行
5. agent 回复后，手机端能看到回复与持续同步的上下文

本次工作的唯一验收句是：

> 安卓端必须稳定完成 `discover -> attach -> send -> VS Code 执行 -> reply 回流` 这条链路。

## 3. 非目标

本次设计明确不包含以下内容：

- 不从手机直接新建 VS Code companion session
- 不从手机直接恢复历史 CLI session
- 不扩展 broker diagnostics 面板
- 不在 P0 内重做 pending queue 策略
- 不追加语音、扫码、通知等安卓专项能力
- 不为了移动端重写一套独立的 broker/session 协议
- 不引入 web 与 mobile 双状态源

## 4. 方案选择

### 4.1 方案 A：在现有 happy-app 上补齐 broker/session 控制闭环

定义：

- 复用现有 machine 页面、attach RPC、session 页面与消息同步链路
- 只补缺失的刷新策略、状态衔接、错误处理与安卓端可用性

优点：

- 风险最低
- 与当前代码结构一致
- 最快形成真实可测的安卓闭环

缺点：

- 第一阶段不会顺手带来更大的 broker 管理能力

### 4.2 方案 B：把 web 端控制页面整体移植到移动端

定义：

- 以 web UI 为模板，重新组织移动端 broker/session 交互

优点：

- 表面上更容易追求“功能对齐”

缺点：

- 容易把 web 交互负担搬到手机
- 与现有移动端页面结构脱节
- 需要更多重复状态管理

### 4.3 方案 C：先抽共享 broker 控制层，再分别适配 web/mobile

定义：

- 先重构共享状态层，再做 UI 收口

优点：

- 长期架构最干净

缺点：

- 对当前 P0 明显过重
- 会推迟安卓闭环验证

### 4.4 结论

正式采用 `方案 A`：

> 不重做 app，不重做 broker 架构，直接在现有 `happy-app` 的 `machine -> attach -> session` 链路上补齐安卓 P0 闭环。

## 5. 现有代码基础

本次设计依赖以下已存在的实现基础：

- `packages/happy-app/package.json`
  - 已有 `android` / `android:dev` / `android:preview` / `android:production`
- `packages/happy-app/app.config.js`
  - 已有 Android package、权限、deep link、`google-services.json`
- `packages/happy-app/sources/app/(app)/machine/[id].tsx`
  - 已有 `machineListBrokerSessions` 与 `machineAttachBrokerSession`
- `packages/happy-app/sources/-session/SessionView.tsx`
  - 已有 broker attached strip、输入框、pending queue panel
- `packages/happy-app/sources/sync/ops.ts`
  - 已有 broker list / attach RPC 包装
- `packages/happy-app/sources/sync/sync.ts`
  - 已有 `sendOrQueueMessage` 作为统一发送入口

因此，本次不应额外创建“安卓专用 broker 页面”或“安卓专用消息通道”。

## 6. 核心产品边界

本次 P0 的产品边界只包含 5 件事：

1. 手机可看到 machine 及其 `VS Code Companion Sessions`
2. 可从 machine 页 attach 到已存在的 broker session
3. attach 后进入 Happy session，并保留 broker attached 身份提示
4. 手机发送消息可驱动真实的 VS Code 会话执行
5. 回复、历史上下文与状态更新可以稳定回流到手机

本次 P0 不要求：

- 手机端提供“新建 session”
- 手机端提供“恢复旧 session”
- 手机端提供完整 broker 调试信息
- 手机端重做 advanced queue orchestration

## 7. 页面流转与数据流

### 7.1 单一路径原则

本次设计保持单一路径：

`machine detail -> broker session list -> attach -> session view -> sendOrQueueMessage -> Happy session sync`

不允许为安卓单独增加第二套“直连 VS Code 插件”的消息路径。

### 7.2 机器页

入口仍然是 `machine/[id].tsx`。

用户在该页面完成：

- 查看 machine 是否在线
- 查看可 attach 的 broker session 列表
- 对特定 `Claude` / `Codex` session 发起 attach

列表展示继续复用当前 broker window 分组与 session 行项目，不在本次 P0 中重写信息架构。

### 7.3 Attach 行为

点击 `Attach` 后：

1. 调用现有 `machineAttachBrokerSession(machineId, brokerSessionId)`
2. 由服务端 / CLI 将 broker session 映射成稳定的 Happy session
3. attach 成功后跳转到统一的 session 页面

这里的关键约束是：

> attach 的产物仍然是 Happy session，而不是移动端自己维护的一条 broker 会话副本。

### 7.4 Session 页

attach 成功后统一进入 `SessionView.tsx`，继续复用：

- 现有聊天列表
- 现有 `AgentInput`
- 现有 broker attached strip / details sheet
- 现有权限、只读、pending queue 组件

不为 broker attached session 创建第二套聊天页。

### 7.5 消息发送

消息发送统一走 `sync.sendOrQueueMessage(...)`：

- 手机端不直接对 VS Code 插件发起私有写入
- 发送仍以 Happy session 为准
- 由服务端 / relay / CLI 把消息桥接到真实的 VS Code 会话

这样可以保证：

- web / mobile / server 使用同一消息事实源
- attach session 的历史、状态、回复都走统一同步层
- 不会出现移动端和 web 各维护一份上下文的情况

### 7.6 回复回流

回复回流也只依赖 Happy session 同步结果：

- 不新增“从 VS Code 本地单独拉消息”的移动端分支
- 手机上看到的消息历史必须来自 Happy session 的同步数据
- broker attached 身份只作为 session 元数据增强，而不是第二消息源

## 8. 刷新与同步策略

P0 要补的重点不是新功能，而是 broker-attached session 的同步稳定性。

### 8.1 attach 成功后的刷新

attach 成功后必须执行一次明确的 session 刷新，确保：

- 新 session 出现在本地 store
- 页面跳转时不会落到空白或未加载状态
- broker 元数据能尽快显示在 session 页上

### 8.2 打开 session 时的补刷新

对 `sessionSource = broker_attached` 的 session：

- 如果首屏消息为空、上下文未就绪或 session 数据明显过旧，页面进入时应触发一次主动 refresh
- 目标是避免“attach 成功但第一页看起来像没连上”的假失败体验

### 8.3 前后台切换

App 从后台回到前台时：

- 如果当前正在查看的是 broker-attached session，应做一次轻量刷新
- 优先保证当前正在看的会话恢复同步，而不是全局大刷新

### 8.4 单一真相源

无论是首次 attach、重新进入 session，还是前后台恢复：

- 统一刷新 Happy session 数据
- 不额外引入安卓端本地 broker message cache 作为第二真相源

## 9. 异常处理

### 9.1 broker session 拉取失败

如果 machine 在线，但 broker session 列表拉取失败：

- 不显示全页错误
- machine 页其它内容继续可用
- `VS Code Companion Sessions` 区域显示局部错误态和 `Retry`

### 9.2 attach 失败

attach 失败时：

- 保持停留在 machine 页
- 不清空当前 broker session 列表
- 给出 toast 或 inline 错误
- 用户可以立即重试

### 9.3 attach 成功但 session 仍未同步到首屏

如果 attach RPC 已成功，但 session 首屏尚未加载完成：

- session 页显示明确的“正在连接 / 正在同步上下文”过渡态
- 不直接显示空白聊天页
- 若超时则自动补一次 refresh
- 再失败才展示可恢复错误

### 9.4 只读/降级 session

对于可 attach 但降级的 broker session：

- 允许进入 session
- 若属于只读模式，输入框禁用并明确说明原因
- 用户仍可查看历史、回复和 broker attached 身份

### 9.5 发送失败

发送失败时：

- 用户 draft 不丢
- 已输入文本保留在输入区或本地 draft
- 避免安卓设备上因一次失败而必须重打整段内容

### 9.6 pending queue

P0 不重新定义 queue 策略，只要求展示准确：

- 仅当服务端明确返回 `queued` 时才展示 queue UI
- 不依赖陈旧时间戳或客户端猜测来判定“是否还在队列中”

## 10. self-host 与官方环境兼容策略

本次 P0 必须同时兼容：

- 官方线上环境
- 本地 / VPS 自建的 `self-host`

设计原则是：

- UI 不区分两套环境
- 仍通过当前 `getServerUrl()`、认证与 session 同步路径工作
- broker attach / session chat 不额外为 self-host 加分支页面

唯一允许的环境差异是：

- 不同环境的服务端稳定性、网络延迟或 broker 可用性不同
- 但移动端产品流程必须一致

## 11. 实现范围

第一阶段允许修改的重点区域：

- `machine/[id].tsx`
  - broker session 列表加载态、错误态、attach 后跳转与刷新
- `SessionView.tsx`
  - broker-attached session 首屏衔接、空态/过渡态、轻量刷新触发
- `sync/ops.ts`
  - 若需要，补强 attach/list 返回值解析与错误传递
- `sync/sync.ts`
  - 若需要，补强 attach 后 refresh / broker-attached session 的发送衔接
- 相关测试

第一阶段不允许顺手扩张到：

- 新建 session 向导
- 恢复历史 session 浏览器
- 大规模重写 store 结构
- broker diagnostics 全面重构

## 12. 测试策略

### 12.1 自动化测试

至少补以下测试：

1. `machine detail` 路由测试
   - broker 列表加载成功
   - broker 列表加载失败
   - attach 成功
   - attach 失败

2. broker ops 测试
   - list / attach DTO 解析稳定
   - broker attached 相关字段缺失或异常时行为可预测

3. session 页面测试
   - broker-attached session 首屏加载
   - 只读态输入禁用
   - 首屏补刷新触发条件

### 12.2 手工验收

安卓模拟器上至少完成以下手工链路：

1. 打开 app
2. 成功登录并看到 machine
3. 看到某个 machine 下的 `VS Code Companion Sessions`
4. 点击 `Attach` 成功进入 session
5. 在手机输入一条文本消息
6. VS Code 插件侧真实收到并开始执行
7. agent 回复回流到手机端
8. App 退后台再回来，session 不变空白、不假死

## 13. 验收标准

本次 P0 完成的标准是：

- 安卓模拟器可稳定发现 machine 与 broker sessions
- attach 不会落入空白页或假 loading
- 手机发送的消息能驱动真实 VS Code 会话执行
- 回复能稳定回流到手机端
- broker-attached session 在恢复前台后仍能继续同步

如果上述任一环节仍需要用户手工靠刷新、重进页面或切换端侧才能恢复，则不视为 P0 完成。

## 14. 后续阶段

P0 完成后，后续可独立起新设计处理：

- 从手机直接新建 / 恢复 session
- 更完整的 pending queue 与插队体验
- broker diagnostics 面板
- 更细的 run / approval / interrupt 可视化
- 移动端对编辑器上下文和 artifact 的增强展示

这些内容都不属于本次实现计划。
