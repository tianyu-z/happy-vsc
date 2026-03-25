import { z } from 'zod';

export const brokerProviderSchema = z.enum(['claude', 'codex']);
export type BrokerProvider = z.infer<typeof brokerProviderSchema>;

export const brokerDesiredModeSchema = z.enum([
  'runtime_preferred',
  'storage_preferred',
]);
export type BrokerDesiredMode = z.infer<typeof brokerDesiredModeSchema>;

export const brokerEffectiveModeSchema = z.enum(['runtime', 'storage']);
export type BrokerEffectiveMode = z.infer<typeof brokerEffectiveModeSchema>;

export const brokerCompatibilitySchema = z.enum([
  'supported',
  'unknown',
  'incompatible',
]);
export type BrokerCompatibility = z.infer<typeof brokerCompatibilitySchema>;

export const brokerProviderExtensionSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();
export type BrokerProviderExtension = z.infer<typeof brokerProviderExtensionSchema>;

export const brokerProbeHealthSchema = z
  .object({
    runtime: z.enum(['ready', 'degraded', 'unavailable']),
    storage: z.enum(['ready', 'stale', 'unavailable']),
  })
  .strict();
export type BrokerProbeHealth = z.infer<typeof brokerProbeHealthSchema>;

const brokerRuntimeMetadataShape = {
  desiredMode: brokerDesiredModeSchema,
  effectiveMode: brokerEffectiveModeSchema,
  modeReason: z.string().min(1),
  compatibility: brokerCompatibilitySchema,
  providerExtension: brokerProviderExtensionSchema,
  probeHealth: brokerProbeHealthSchema,
} as const;

export const brokerAttachabilitySchema = z.enum([
  'attachable',
  'attachable_with_degraded_capabilities',
  'not_attachable',
]);
export type BrokerAttachability = z.infer<typeof brokerAttachabilitySchema>;

export const brokerDiscoveredSessionSchema = z
  .object({
    brokerSessionId: z.string().min(1),
    provider: brokerProviderSchema,
    title: z.string(),
    attachability: brokerAttachabilitySchema,
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    ...brokerRuntimeMetadataShape,
  })
  .strict();
export type BrokerDiscoveredSession = z.infer<typeof brokerDiscoveredSessionSchema>;

export const brokerSnapshotSchema = z
  .object({
    brokerSessionId: z.string().min(1),
    provider: brokerProviderSchema,
    latestSeq: z.number().int().nonnegative(),
    capabilities: z.array(z.string()),
    degradedFlags: z.array(z.string()),
    ...brokerRuntimeMetadataShape,
  })
  .strict();
export type BrokerSnapshot = z.infer<typeof brokerSnapshotSchema>;

export const brokerAttachmentRefSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['image', 'file', 'patch', 'diff', 'artifact']),
    label: z.string().min(1),
    openRef: z.string().min(1).optional(),
  })
  .strict();
export type BrokerAttachmentRef = z.infer<typeof brokerAttachmentRefSchema>;

export const brokerEventRoleSchema = z.enum(['user', 'assistant', 'tool']);
export type BrokerEventRole = z.infer<typeof brokerEventRoleSchema>;

const brokerSnapshotEventSchema = z
  .object({
    type: z.literal('session.snapshot'),
    snapshot: brokerSnapshotSchema,
  })
  .strict();

const brokerDiscoveredSessionEventSchema = z
  .object({
    type: z.literal('session.discovered'),
    session: brokerDiscoveredSessionSchema,
  })
  .strict();

const brokerMessageDeltaEventSchema = z
  .object({
    type: z.literal('session.message.delta'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        role: brokerEventRoleSchema,
        text: z.string(),
      })
      .strict(),
  })
  .strict();

const brokerRunStatusEventSchema = z
  .object({
    type: z.literal('session.run.status'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        status: z.enum([
          'idle',
          'running',
          'waiting_approval',
          'interrupted',
          'completed',
          'failed',
        ]),
        reason: z.string().optional(),
      })
      .strict(),
  })
  .strict();

const brokerApprovalDecisionSchema = z.enum(['approve', 'deny']);

const brokerApprovalRequestedEventSchema = z
  .object({
    type: z.literal('session.approval.requested'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        approvalId: z.string().min(1),
        label: z.string(),
        description: z.string().optional(),
      })
      .strict(),
  })
  .strict();

const brokerApprovalResolvedEventSchema = z
  .object({
    type: z.literal('session.approval.resolved'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        approvalId: z.string().min(1),
        decision: brokerApprovalDecisionSchema,
      })
      .strict(),
  })
  .strict();

const brokerApprovalDismissedEventSchema = z
  .object({
    type: z.literal('session.approval.dismissed'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        approvalId: z.string().min(1),
      })
      .strict(),
  })
  .strict();

const brokerInterruptEventSchema = z
  .object({
    type: z.literal('session.interrupt'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        outcome: z.enum(['requested', 'accepted', 'rejected', 'completed']),
        reason: z.string().optional(),
      })
      .strict(),
  })
  .strict();

const brokerAttachmentAddedEventSchema = z
  .object({
    type: z.literal('session.attachment.added'),
    brokerSessionId: z.string().min(1),
    payload: z
      .object({
        attachment: brokerAttachmentRefSchema,
      })
      .strict(),
  })
  .strict();

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

export const brokerEventLogEntrySchema = z
  .object({
    seq: z.number().int().nonnegative(),
    at: z.number().int().nonnegative(),
    sessionId: z.string().min(1),
    event: brokerEventSchema,
  })
  .strict();
export type BrokerEventLogEntry = z.infer<typeof brokerEventLogEntrySchema>;

export const brokerEventNotificationSchema = z
  .object({
    method: z.literal('brokerEvent'),
    params: z
      .object({
        brokerSessionId: z.string().min(1),
        entry: brokerEventLogEntrySchema,
      })
      .strict(),
  })
  .strict();
export type BrokerEventNotification = z.infer<typeof brokerEventNotificationSchema>;
