export type SessionActivitySnapshot = {
  active: boolean;
  activeAt: number;
};

export function mergeSessionActivity(
  existing: SessionActivitySnapshot | undefined,
  incoming: SessionActivitySnapshot,
  options: {
    preserveLocalInactive?: boolean;
  } = {},
): SessionActivitySnapshot {
  if (options.preserveLocalInactive && existing && !existing.active && incoming.active) {
    return {
      active: false,
      activeAt: existing.activeAt,
    };
  }

  return {
    active: incoming.active,
    activeAt: existing ? Math.max(existing.activeAt, incoming.activeAt) : incoming.activeAt,
  };
}
