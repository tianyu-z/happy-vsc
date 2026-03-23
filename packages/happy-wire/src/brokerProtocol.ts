import * as z from 'zod';

export const brokerProviderSchema = z.enum(['claude', 'codex']);
export type BrokerProvider = z.infer<typeof brokerProviderSchema>;

export const brokerAttachabilitySchema = z.enum([
  'attachable',
  'attachable_with_degraded_capabilities',
  'not_attachable',
]);
export type BrokerAttachability = z.infer<typeof brokerAttachabilitySchema>;

export const brokerSnapshotSchema = z.object({
  brokerSessionId: z.string(),
  provider: brokerProviderSchema,
  latestSeq: z.number(),
  capabilities: z.array(z.string()),
  degradedFlags: z.array(z.string()),
});
export type BrokerSnapshot = z.infer<typeof brokerSnapshotSchema>;

export const brokerDiscoveredSessionSchema = z.object({
  brokerSessionId: z.string(),
  provider: brokerProviderSchema,
  title: z.string(),
  attachability: brokerAttachabilitySchema,
  capabilities: z.array(z.string()),
  degradedFlags: z.array(z.string()),
});
export type BrokerDiscoveredSession = z.infer<typeof brokerDiscoveredSessionSchema>;

const brokerSnapshotEventSchema = z.object({
  type: z.literal('session.snapshot'),
  snapshot: brokerSnapshotSchema,
});

const brokerDiscoveredSessionEventSchema = z.object({
  type: z.literal('session.discovered'),
  session: brokerDiscoveredSessionSchema,
});

export const brokerEventSchema = z.discriminatedUnion('type', [
  brokerSnapshotEventSchema,
  brokerDiscoveredSessionEventSchema,
]);
export type BrokerEvent = z.infer<typeof brokerEventSchema>;
