import * as z from 'zod';

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
});
export type BrokerProviderExtension = z.infer<typeof brokerProviderExtensionSchema>;

export const brokerProbeRuntimeHealthSchema = z.enum(['ready', 'degraded', 'unavailable']);
export type BrokerProbeRuntimeHealth = z.infer<typeof brokerProbeRuntimeHealthSchema>;

export const brokerProbeStorageHealthSchema = z.enum(['ready', 'stale', 'unavailable']);
export type BrokerProbeStorageHealth = z.infer<typeof brokerProbeStorageHealthSchema>;

export const brokerProbeHealthSchema = z.object({
  runtime: brokerProbeRuntimeHealthSchema,
  storage: brokerProbeStorageHealthSchema,
});
export type BrokerProbeHealth = z.infer<typeof brokerProbeHealthSchema>;

export const brokerRuntimeMetadataSchema = z.object({
  desiredMode: brokerDesiredModeSchema,
  effectiveMode: brokerEffectiveModeSchema,
  modeReason: brokerModeReasonSchema,
  compatibility: brokerCompatibilitySchema,
  providerExtension: brokerProviderExtensionSchema,
  probeHealth: brokerProbeHealthSchema,
});
export type BrokerRuntimeMetadata = z.infer<typeof brokerRuntimeMetadataSchema>;

export const brokerAttachabilitySchema = z.enum([
  'attachable',
  'attachable_with_degraded_capabilities',
  'not_attachable',
]);
export type BrokerAttachability = z.infer<typeof brokerAttachabilitySchema>;

export const brokerSnapshotSchema = z
  .object({
    brokerSessionId: z.string(),
    provider: brokerProviderSchema,
    latestSeq: z.number(),
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
  })
  .merge(brokerRuntimeMetadataSchema);
export type BrokerSnapshot = z.infer<typeof brokerSnapshotSchema>;

export const brokerDiscoveredSessionSchema = z
  .object({
    brokerSessionId: z.string(),
    provider: brokerProviderSchema,
    title: z.string(),
    attachability: brokerAttachabilitySchema,
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
  })
  .merge(brokerRuntimeMetadataSchema);
export type BrokerDiscoveredSession = z.infer<typeof brokerDiscoveredSessionSchema>;

export const brokerAttachmentRefSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  label: z.string().min(1),
  openRef: z.string().min(1).optional(),
});
export type BrokerAttachmentRef = z.infer<typeof brokerAttachmentRefSchema>;

export const brokerApprovalDecisionSchema = z.enum(['approve', 'deny']);
export type BrokerApprovalDecision = z.infer<typeof brokerApprovalDecisionSchema>;

export const brokerSendMessageIntentSchema = z.object({
  brokerSessionId: z.string(),
  text: z.string(),
});
export type BrokerSendMessageIntent = z.infer<typeof brokerSendMessageIntentSchema>;

export const brokerInterruptIntentSchema = z.object({
  brokerSessionId: z.string(),
  reason: z.string(),
});
export type BrokerInterruptIntent = z.infer<typeof brokerInterruptIntentSchema>;

export const brokerResolveApprovalIntentSchema = z.object({
  brokerSessionId: z.string(),
  approvalId: z.string(),
  decision: brokerApprovalDecisionSchema,
});
export type BrokerResolveApprovalIntent = z.infer<typeof brokerResolveApprovalIntentSchema>;

export const brokerSetDesiredModeIntentSchema = z.object({
  brokerSessionId: z.string(),
  desiredMode: brokerDesiredModeSchema,
});
export type BrokerSetDesiredModeIntent = z.infer<typeof brokerSetDesiredModeIntentSchema>;

export const brokerPositionSchema = z.object({
  line: z.number().int().nonnegative(),
  character: z.number().int().nonnegative(),
});
export type BrokerPosition = z.infer<typeof brokerPositionSchema>;

export const brokerSelectionRangeSchema = z.object({
  start: brokerPositionSchema,
  end: brokerPositionSchema,
});
export type BrokerSelectionRange = z.infer<typeof brokerSelectionRangeSchema>;

export const brokerDiagnosticsSummarySchema = z.object({
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  infos: z.number().int().nonnegative(),
  hints: z.number().int().nonnegative(),
});
export type BrokerDiagnosticsSummary = z.infer<typeof brokerDiagnosticsSummarySchema>;

export const brokerCaptureEditorContextResultSchema = z.object({
  activeFilePath: z.string(),
  selectedText: z.string(),
  selectionRanges: z.array(brokerSelectionRangeSchema),
  workspaceRoots: z.array(z.string()),
  diagnosticsSummary: brokerDiagnosticsSummarySchema,
});
export type BrokerCaptureEditorContextResult = z.infer<
  typeof brokerCaptureEditorContextResultSchema
>;

const brokerSnapshotEventSchema = z.object({
  type: z.literal('session.snapshot'),
  snapshot: brokerSnapshotSchema,
});

const brokerDiscoveredSessionEventSchema = z.object({
  type: z.literal('session.discovered'),
  session: brokerDiscoveredSessionSchema,
});

export const brokerEventRoleSchema = z.enum(['user', 'assistant', 'tool']);
export type BrokerEventRole = z.infer<typeof brokerEventRoleSchema>;

const brokerMessageDeltaEventSchema = z.object({
  type: z.literal('session.message.delta'),
  brokerSessionId: z.string(),
  role: brokerEventRoleSchema,
  text: z.string(),
});

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
  brokerSessionId: z.string(),
  status: brokerRunStatusSchema,
  reason: z.string().optional(),
});

const brokerApprovalRequestedEventSchema = z.object({
  type: z.literal('session.approval.requested'),
  brokerSessionId: z.string(),
  approvalId: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const brokerApprovalResolvedEventSchema = z.object({
  type: z.literal('session.approval.resolved'),
  brokerSessionId: z.string(),
  approvalId: z.string(),
  decision: brokerApprovalDecisionSchema,
});

const brokerApprovalDismissedEventSchema = z.object({
  type: z.literal('session.approval.dismissed'),
  brokerSessionId: z.string(),
  approvalId: z.string(),
});

export const brokerInterruptOutcomeSchema = z.enum([
  'requested',
  'accepted',
  'rejected',
  'completed',
]);
export type BrokerInterruptOutcome = z.infer<typeof brokerInterruptOutcomeSchema>;

const brokerInterruptEventSchema = z.object({
  type: z.literal('session.interrupt'),
  brokerSessionId: z.string(),
  outcome: brokerInterruptOutcomeSchema,
  reason: z.string().optional(),
});

const brokerAttachmentAddedEventSchema = z.object({
  type: z.literal('session.attachment.added'),
  brokerSessionId: z.string(),
  attachment: brokerAttachmentRefSchema,
});

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
const brokerOkResponseSchema = z.object({ ok: z.literal(true) });

const brokerDiscoverSessionsRequestSchema = z.object({});
const brokerDiscoverSessionsResponseSchema = z.object({
  sessions: z.array(brokerDiscoveredSessionSchema),
});

const brokerAttachSessionRequestSchema = z.object({
  brokerSessionId: z.string(),
});
const brokerAttachSessionResponseSchema = z.object({
  snapshot: brokerSnapshotSchema,
});

const brokerCaptureEditorContextRequestSchema = z.object({
  brokerSessionId: z.string(),
});

const brokerListAttachmentsRequestSchema = z.object({
  brokerSessionId: z.string(),
});
const brokerListAttachmentsResponseSchema = z.object({
  attachments: z.array(brokerAttachmentRefSchema),
});

const brokerSetSessionDesiredModeResponseSchema = z.object({
  snapshot: brokerSnapshotSchema,
});

const brokerSubscribeEventsRequestSchema = z.object({
  // If omitted, broker decides subscription scope (typically all visible sessions).
  brokerSessionId: z.string().optional(),
});

export const brokerRpcContract = {
  discoverSessions: {
    request: brokerDiscoverSessionsRequestSchema,
    response: brokerDiscoverSessionsResponseSchema,
  },
  attachSession: {
    request: brokerAttachSessionRequestSchema,
    response: brokerAttachSessionResponseSchema,
  },
  sendMessage: {
    request: brokerSendMessageIntentSchema,
    response: brokerOkResponseSchema,
  },
  interruptSession: {
    request: brokerInterruptIntentSchema,
    response: brokerOkResponseSchema,
  },
  resolveApproval: {
    request: brokerResolveApprovalIntentSchema,
    response: brokerOkResponseSchema,
  },
  captureEditorContext: {
    request: brokerCaptureEditorContextRequestSchema,
    response: brokerCaptureEditorContextResultSchema,
  },
  listAttachments: {
    request: brokerListAttachmentsRequestSchema,
    response: brokerListAttachmentsResponseSchema,
  },
  setSessionDesiredMode: {
    request: brokerSetDesiredModeIntentSchema,
    response: brokerSetSessionDesiredModeResponseSchema,
  },
  subscribeEvents: {
    request: brokerSubscribeEventsRequestSchema,
    // Event stream is out-of-band. This response is just an ack/handshake.
    response: brokerOkResponseSchema,
  },
} as const;

export type BrokerRpcContract = typeof brokerRpcContract;
