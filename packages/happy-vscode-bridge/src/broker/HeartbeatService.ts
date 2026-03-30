import type { BrokerInstanceManifest } from 'happy-wire';

type ManifestStoreLike = {
  write(manifest: BrokerInstanceManifest): Promise<void>;
  delete(): Promise<void>;
};

type HeartbeatServiceOptions = {
  intervalMs: number;
  now?: () => number;
  manifestStore: ManifestStoreLike;
  buildManifest: (lastHeartbeatAt: number) => BrokerInstanceManifest;
};

export class HeartbeatService {
  private readonly intervalMs: number;
  private readonly now: () => number;
  private readonly manifestStore: ManifestStoreLike;
  private readonly buildManifest: (lastHeartbeatAt: number) => BrokerInstanceManifest;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: HeartbeatServiceOptions) {
    this.intervalMs = options.intervalMs;
    this.now = options.now ?? Date.now;
    this.manifestStore = options.manifestStore;
    this.buildManifest = options.buildManifest;
  }

  async start(): Promise<void> {
    if (this.timer) {
      return;
    }

    await this.writeHeartbeat();
    this.timer = setInterval(() => {
      void this.writeHeartbeat();
    }, this.intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await this.manifestStore.delete();
  }

  private async writeHeartbeat(): Promise<void> {
    const heartbeatAt = this.now();
    await this.manifestStore.write(this.buildManifest(heartbeatAt));
  }
}
