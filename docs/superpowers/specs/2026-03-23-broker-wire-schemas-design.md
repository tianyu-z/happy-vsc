# Broker wire schema design

## 摘要
- 共享的 broker 协议需要在 `happy-wire` 中暴露可重用的 Zod schema，供后续组件校验发现、快照与事件包。
- 设计遵循 Task 2 提供的字段，优先保持最小表面积并确保 TDD 流程：先写失败的测试，再实现 schema，最后 typecheck。

## 背景
- Task 2 要求新增 broker 发现、快照、事件三类 schema，并让 `happy-wire` 的入口导出它们。
- 当前仓库已经有几个协议相关的文件，新的 `brokerProtocol.ts` 应与现有 schema 组织方式一致，保持导出聚合（`index.ts`）。

## 设计
1. 在 `packages/happy-wire/src/brokerProtocol.ts` 定义 `brokerProviderSchema`、`brokerAttachabilitySchema`，并构造快照/发现包的对象 schema（包括 `brokerSessionId`、`provider`、`title`、`attachability`、`capabilities`、`degradedFlags` 等字段）。
2. 用 `z.discriminatedUnion('type', [...])` 构造 `brokerEventSchema`，起始结构覆盖 discovery + snapshot 所需的 event type，后续可以再扩展。
3. 将新的 schema 从 `index.ts` 重新导出，确保链路的导入路径不变。

## 测试与验证
- 先创建 `brokerProtocol.test.ts`，添加 Task 2 示例的 `expect(brokerDiscoveredSessionSchema.parse(...)).toBe('claude')` 测试，并验证在 schema 模块缺失时失败。
- 之后实现 schema，并再跑一次该测试确保通过。
- 最后在 `packages/happy-wire` 目录执行 `COREPACK_HOME=/tmp/corepack corepack yarn typecheck`，保证类型安全。

## 后续流程
- 设计文档完成后提交到仓库，并在开发完成后补充对应的 commit 外部验证（如 spec review loop 说明时可注明无法自动执行）。
