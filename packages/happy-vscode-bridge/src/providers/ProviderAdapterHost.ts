import type { BrokerProvider } from 'happy-wire';

import type {
  ApprovalIntent,
  BrokerEditorContext,
  DiscoveredBrokerSession,
  InterruptIntent,
  ProviderAdapter,
  ProviderAdapterHealth,
  ProviderAdapterMap,
  ProviderAttachment,
  ProviderEvent,
  SendUserMessageIntent,
} from './types';

type SessionBinding = {
  provider: BrokerProvider;
  providerSessionRef: string;
  capabilities: string[];
  degradedFlags: string[];
};

type SendMessageInput = Omit<SendUserMessageIntent, 'brokerSessionId' | 'providerSessionRef'>;
type InterruptInput = Omit<InterruptIntent, 'brokerSessionId' | 'providerSessionRef'>;
type ApprovalInput = Omit<ApprovalIntent, 'brokerSessionId' | 'providerSessionRef'>;

function mergeDegradedFlags(base: string[], health: ProviderAdapterHealth | undefined): string[] {
  const degradedFlags = new Set(base);

  if (!health) {
    return [...degradedFlags];
  }

  if (health.approvalBridgeAvailable === false) {
    degradedFlags.add('approval_bridge_unavailable');
  }

  if (health.attachmentBridgeAvailable === false) {
    degradedFlags.add('attachment_bridge_unavailable');
  }

  if (health.readOnlyAttach) {
    degradedFlags.add('read_only_attach');
  }

  for (const degradedFlag of health.degradedFlags ?? []) {
    degradedFlags.add(degradedFlag);
  }

  return [...degradedFlags];
}

export class ProviderAdapterHost {
  private readonly adapters: ProviderAdapterMap;
  private readonly sessions = new Map<string, SessionBinding>();

  constructor(adapters: ProviderAdapterMap) {
    this.adapters = adapters;
  }

  async discover(): Promise<DiscoveredBrokerSession[]> {
    const discovered: DiscoveredBrokerSession[] = [];

    for (const provider of Object.keys(this.adapters) as BrokerProvider[]) {
      const adapter = this.adapters[provider];
      if (!adapter) {
        continue;
      }

      const sessions = await adapter.discover();

      for (const session of sessions) {
        const health = await this.getHealth(adapter, session.providerSessionRef);
        const degradedFlags = mergeDegradedFlags(session.degradedFlags, health);
        const attachability =
          session.attachability === 'attachable' && degradedFlags.length > 0
            ? 'attachable_with_degraded_capabilities'
            : session.attachability;

        this.sessions.set(session.brokerSessionId, {
          provider,
          providerSessionRef: session.providerSessionRef,
          capabilities: session.capabilities,
          degradedFlags,
        });

        discovered.push({
          ...session,
          attachability,
          degradedFlags,
        });
      }
    }

    return discovered;
  }

  async attach(sessionRef: string): Promise<ProviderAttachment | null> {
    const { adapter, binding, brokerSessionId } = this.getAdapterAndBindingFromRef(sessionRef);
    const attachment = await adapter.attach(binding.providerSessionRef);

    if (!attachment) {
      return null;
    }

    const health = await this.getHealth(adapter, binding.providerSessionRef);
    const degradedFlags = mergeDegradedFlags(attachment.degradedFlags, health);

    this.sessions.set(brokerSessionId, {
      provider: binding.provider,
      providerSessionRef: binding.providerSessionRef,
      capabilities: attachment.capabilities,
      degradedFlags,
    });

    return {
      ...attachment,
      degradedFlags,
    };
  }

  async sendMessage(brokerSessionId: string, intent: SendMessageInput): Promise<void> {
    const { adapter, binding } = this.getAdapterAndBinding(brokerSessionId);

    await adapter.sendUserMessage({
      brokerSessionId,
      providerSessionRef: binding.providerSessionRef,
      ...intent,
    });
  }

  async interrupt(brokerSessionId: string, intent: InterruptInput): Promise<void> {
    const { adapter, binding } = this.getAdapterAndBinding(brokerSessionId);

    await adapter.interrupt({
      brokerSessionId,
      providerSessionRef: binding.providerSessionRef,
      ...intent,
    });
  }

  async resolveApproval(brokerSessionId: string, intent: ApprovalInput): Promise<void> {
    const { adapter, binding } = this.getAdapterAndBinding(brokerSessionId);

    await adapter.resolveApproval({
      brokerSessionId,
      providerSessionRef: binding.providerSessionRef,
      ...intent,
    });
  }

  async captureEditorContext(brokerSessionId: string): Promise<BrokerEditorContext | null> {
    const { adapter, binding } = this.getAdapterAndBinding(brokerSessionId);

    if (!adapter.captureEditorContext) {
      return null;
    }

    return adapter.captureEditorContext(binding.providerSessionRef);
  }

  async watchEvents(
    brokerSessionId: string,
    onEvent: (event: ProviderEvent) => void,
  ): Promise<() => void> {
    const { adapter, binding } = this.getAdapterAndBinding(brokerSessionId);

    if (!adapter.watchEvents) {
      return () => {};
    }

    const cleanup = await adapter.watchEvents(binding.providerSessionRef, onEvent);
    return cleanup;
  }

  getCapabilities(brokerSessionId: string): { capabilities: string[]; degradedFlags: string[] } {
    const binding = this.sessions.get(brokerSessionId);

    if (!binding) {
      return {
        capabilities: [],
        degradedFlags: [],
      };
    }

    return {
      capabilities: [...binding.capabilities],
      degradedFlags: [...binding.degradedFlags],
    };
  }

  private async getHealth(
    adapter: ProviderAdapter,
    providerSessionRef: string,
  ): Promise<ProviderAdapterHealth | undefined> {
    if (!adapter.getHealth) {
      return undefined;
    }

    return adapter.getHealth(providerSessionRef);
  }

  private getAdapterAndBinding(
    brokerSessionId: string,
  ): { adapter: ProviderAdapter; binding: SessionBinding } {
    const binding = this.sessions.get(brokerSessionId);
    if (!binding) {
      throw new Error(`Unknown broker session: ${brokerSessionId}`);
    }

    const adapter = this.adapters[binding.provider];
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${binding.provider}`);
    }

    return { adapter, binding };
  }

  private getAdapterAndBindingFromRef(
    sessionRef: string,
  ): { adapter: ProviderAdapter; binding: SessionBinding; brokerSessionId: string } {
    const directBinding = this.sessions.get(sessionRef);
    if (directBinding) {
      const adapter = this.adapters[directBinding.provider];
      if (!adapter) {
        throw new Error(`No adapter registered for provider: ${directBinding.provider}`);
      }

      return {
        adapter,
        binding: directBinding,
        brokerSessionId: sessionRef,
      };
    }

    for (const [brokerSessionId, binding] of this.sessions.entries()) {
      if (binding.providerSessionRef !== sessionRef) {
        continue;
      }

      const adapter = this.adapters[binding.provider];
      if (!adapter) {
        throw new Error(`No adapter registered for provider: ${binding.provider}`);
      }

      return {
        adapter,
        binding,
        brokerSessionId,
      };
    }

    throw new Error(`Unknown broker session: ${sessionRef}`);
  }
}
