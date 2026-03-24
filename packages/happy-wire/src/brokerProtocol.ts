import * as z from 'zod';

const brokerIdSchema = z.string().min(1);

export const brokerProviderSchema = z.enum(['claude', 'codex']);
export type BrokerProvider = z.infer<typeof brokerProviderSchema>;

export const brokerDesiredModeSchema = z.enum(['runtime_preferred', 'storage_preferred']);
export type BrokerDesiredMode = z.infer<typeof brokerDesiredModeSchema>;

export const brokerEffectiveModeSchema = z.enum(['runtime', 'storage']);
export type BrokerEffectiveMode = z.infer<typeof brokerEffectiveModeSchema>;

// Machine-readable reason string. Keep it opaque for now, but non-empty.
export const brokerModeReasonSchema = z.string().min(1);
export type BrokerModeReason = z.infer<typeof brokerModeReasonSchema>;

export const brokerCompatibilitySchema = z.enum(['supported', 'unknown', 'incompatible']);
export type BrokerCompatibility = z.infer<typeof brokerCompatibilitySchema>;

export const brokerProviderExtensionSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
}).strict();
export type BrokerProviderExtension = z.infer<typeof brokerProviderExtensionSchema>;

export const brokerProbeRuntimeHealthSchema = z.enum(['ready', 'degraded', 'unavailable']);
export type BrokerProbeRuntimeHealth = z.infer<typeof brokerProbeRuntimeHealthSchema>;

export const brokerProbeStorageHealthSchema = z.enum(['ready', 'stale', 'unavailable']);
export type BrokerProbeStorageHealth = z.infer<typeof brokerProbeStorageHealthSchema>;

export const brokerProbeHealthSchema = z.object({
  runtime: brokerProbeRuntimeHealthSchema,
  storage: brokerProbeStorageHealthSchema,
}).strict();
export type BrokerProbeHealth = z.infer<typeof brokerProbeHealthSchema>;

const brokerRuntimeMetadataShape = {
  desiredMode: brokerDesiredModeSchema,
  effectiveMode: brokerEffectiveModeSchema,
  modeReason: brokerModeReasonSchema,
  compatibility: brokerCompatibilitySchema,
  providerExtension: brokerProviderExtensionSchema,
  probeHealth: brokerProbeHealthSchema,
} as const;

export const brokerRuntimeMetadataSchema = z.object({
  ...brokerRuntimeMetadataShape,
}).strict();
export type BrokerRuntimeMetadata = z.infer<typeof brokerRuntimeMetadataSchema>;

export const brokerAttachabilitySchema = z.enum([
  'attachable',
  'attachable_with_degraded_capabilities',
  'not_attachable',
]);
export type BrokerAttachability = z.infer<typeof brokerAttachabilitySchema>;

export const brokerSnapshotSchema = z
  .object({
    brokerSessionId: brokerIdSchema,
    provider: brokerProviderSchema,
    latestSeq: z.number().int().nonnegative(),
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    ...brokerRuntimeMetadataShape,
  })
  .strict();
export type BrokerSnapshot = z.infer<typeof brokerSnapshotSchema>;

export const brokerDiscoveredSessionSchema = z
  .object({
    brokerSessionId: brokerIdSchema,
    provider: brokerProviderSchema,
    title: z.string(),
    attachability: brokerAttachabilitySchema,
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    ...brokerRuntimeMetadataShape,
  })
  .strict();
export type BrokerDiscoveredSession = z.infer<typeof brokerDiscoveredSessionSchema>;

export const brokerAttachmentKindSchema = z.enum([
  'image',
  'file',
  'patch',
  'diff',
  'artifact',
]);
export type BrokerAttachmentKind = z.infer<typeof brokerAttachmentKindSchema>;

export const brokerAttachmentRefSchema = z.object({
  id: brokerIdSchema,
  kind: brokerAttachmentKindSchema,
  label: z.string().min(1),
  openRef: z.string().min(1).optional(),
}).strict();
export type BrokerAttachmentRef = z.infer<typeof brokerAttachmentRefSchema>;

export const brokerApprovalDecisionSchema = z.enum(['approve', 'deny']);
export type BrokerApprovalDecision = z.infer<typeof brokerApprovalDecisionSchema>;

export const brokerSendMessageIntentSchema = z.object({
  brokerSessionId: brokerIdSchema,
  text: z.string(),
}).strict();
export type BrokerSendMessageIntent = z.infer<typeof brokerSendMessageIntentSchema>;

export const brokerInterruptIntentSchema = z.object({
  brokerSessionId: brokerIdSchema,
  reason: z.string(),
}).strict();
export type BrokerInterruptIntent = z.infer<typeof brokerInterruptIntentSchema>;

export const brokerResolveApprovalIntentSchema = z.object({
  brokerSessionId: brokerIdSchema,
  approvalId: brokerIdSchema,
  decision: brokerApprovalDecisionSchema,
}).strict();
export type BrokerResolveApprovalIntent = z.infer<typeof brokerResolveApprovalIntentSchema>;

export const brokerSetDesiredModeIntentSchema = z.object({
  brokerSessionId: brokerIdSchema,
  desiredMode: brokerDesiredModeSchema,
}).strict();
export type BrokerSetDesiredModeIntent = z.infer<typeof brokerSetDesiredModeIntentSchema>;

export const brokerSelectionRangeSchema = z.object({
  startLine: z.number().int().nonnegative(),
  startCharacter: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  endCharacter: z.number().int().nonnegative(),
}).strict();
export type BrokerSelectionRange = z.infer<typeof brokerSelectionRangeSchema>;

export const brokerDiagnosticsSummarySchema = z.object({
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  infos: z.number().int().nonnegative(),
  hints: z.number().int().nonnegative(),
}).strict();
export type BrokerDiagnosticsSummary = z.infer<typeof brokerDiagnosticsSummarySchema>;

export const brokerCaptureEditorContextResultSchema = z.object({
  activeFilePath: z.string().nullable(),
  selectedText: z.string().nullable(),
  selectionRanges: z.array(brokerSelectionRangeSchema),
  workspaceRoots: z.array(z.string()),
  diagnosticsSummary: brokerDiagnosticsSummarySchema,
}).strict();
export type BrokerCaptureEditorContextResult = z.infer<
  typeof brokerCaptureEditorContextResultSchema
>;

const brokerSnapshotEventSchema = z.object({
  type: z.literal('session.snapshot'),
  snapshot: brokerSnapshotSchema,
}).strict();

const brokerDiscoveredSessionEventSchema = z.object({
  type: z.literal('session.discovered'),
  session: brokerDiscoveredSessionSchema,
}).strict();

export const brokerEventRoleSchema = z.enum(['user', 'assistant', 'tool']);
export type BrokerEventRole = z.infer<typeof brokerEventRoleSchema>;

const brokerMessageDeltaEventSchema = z.object({
  type: z.literal('session.message.delta'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    role: brokerEventRoleSchema,
    text: z.string(),
  }).strict(),
}).strict();

export const brokerRunStatusSchema = z.enum([
  'idle',
  'running',
  'waiting_approval',
  'interrupted',
  'completed',
  'failed',
]);
export type BrokerRunStatus = z.infer<typeof brokerRunStatusSchema>;

const brokerRunStatusEventSchema = z.object({
  type: z.literal('session.run.status'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    status: brokerRunStatusSchema,
    reason: z.string().optional(),
  }).strict(),
}).strict();

const brokerApprovalRequestedEventSchema = z.object({
  type: z.literal('session.approval.requested'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    approvalId: brokerIdSchema,
    label: z.string(),
    description: z.string().optional(),
  }).strict(),
}).strict();

const brokerApprovalResolvedEventSchema = z.object({
  type: z.literal('session.approval.resolved'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    approvalId: brokerIdSchema,
    decision: brokerApprovalDecisionSchema,
  }).strict(),
}).strict();

const brokerApprovalDismissedEventSchema = z.object({
  type: z.literal('session.approval.dismissed'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    approvalId: brokerIdSchema,
  }).strict(),
}).strict();

export const brokerInterruptOutcomeSchema = z.enum([
  'requested',
  'accepted',
  'rejected',
  'completed',
]);
export type BrokerInterruptOutcome = z.infer<typeof brokerInterruptOutcomeSchema>;

const brokerInterruptEventSchema = z.object({
  type: z.literal('session.interrupt'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    outcome: brokerInterruptOutcomeSchema,
    reason: z.string().optional(),
  }).strict(),
}).strict();

const brokerAttachmentAddedEventSchema = z.object({
  type: z.literal('session.attachment.added'),
  brokerSessionId: brokerIdSchema,
  payload: z.object({
    attachment: brokerAttachmentRefSchema,
  }).strict(),
}).strict();

export const brokerEventSchema = z.discriminatedUnion('type', [
  brokerSnapshotEventSchema,
  brokerDiscoveredSessionEventSchema,
  brokerMessageDeltaEventSchema,
  brokerRunStatusEventSchema,
  brokerApprovalRequestedEventSchema,
  brokerApprovalResolvedEventSchema,
  brokerApprovalDismissedEventSchema,
  brokerInterruptEventSchema,
  brokerAttachmentAddedEventSchema,
]);
export type BrokerEvent = z.infer<typeof brokerEventSchema>;

// Minimal RPC contract surface for the broker. Consumers can use the schemas directly.
const brokerOkResultSchema = z.literal(true);

const brokerDiscoverSessionsParamsSchema = z.object({}).strict();
const brokerAttachSessionParamsSchema = z.object({
  brokerSessionId: brokerIdSchema,
}).strict();
const brokerCaptureEditorContextParamsSchema = z.object({
  brokerSessionId: brokerIdSchema,
}).strict();
const brokerListAttachmentsParamsSchema = z.object({
  brokerSessionId: brokerIdSchema,
}).strict();
const brokerSubscribeEventsParamsSchema = z.object({
  brokerSessionId: brokerIdSchema,
}).strict();

export const brokerRpcContract = {
  discoverSessions: {
    params: brokerDiscoverSessionsParamsSchema,
    result: z.array(brokerDiscoveredSessionSchema),
  },
  attachSession: {
    params: brokerAttachSessionParamsSchema,
    result: brokerSnapshotSchema.nullable(),
  },
  sendMessage: {
    params: brokerSendMessageIntentSchema,
    result: brokerOkResultSchema,
  },
  interruptSession: {
    params: brokerInterruptIntentSchema,
    result: brokerOkResultSchema,
  },
  resolveApproval: {
    params: brokerResolveApprovalIntentSchema,
    result: brokerOkResultSchema,
  },
  captureEditorContext: {
    params: brokerCaptureEditorContextParamsSchema,
    result: brokerCaptureEditorContextResultSchema.nullable(),
  },
  listAttachments: {
    params: brokerListAttachmentsParamsSchema,
    result: z.array(brokerAttachmentRefSchema),
  },
  setSessionDesiredMode: {
    params: brokerSetDesiredModeIntentSchema,
    result: brokerDiscoveredSessionSchema,
  },
  subscribeEvents: {
    params: brokerSubscribeEventsParamsSchema,
    result: brokerOkResultSchema,
  },
} as const;

export type BrokerRpcContract = typeof brokerRpcContract;
