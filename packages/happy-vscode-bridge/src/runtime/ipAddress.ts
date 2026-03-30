import { networkInterfaces } from 'node:os';

type NetworkInterfacesProvider = typeof networkInterfaces;

type HostIpInfo = {
  bridgeHostIps: string[];
  preferredHostIp?: string;
  runtimeIp?: string;
};

function normalizeFamily(family: string | number): string {
  return typeof family === 'number'
    ? family === 4
      ? 'IPv4'
      : family === 6
        ? 'IPv6'
        : String(family)
    : family;
}

export function detectHostIpInfo(
  provider: NetworkInterfacesProvider = networkInterfaces,
): HostIpInfo {
  const interfaces = provider();
  const ipv4: string[] = [];
  const ipv6: string[] = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.internal) {
        continue;
      }

      const family = normalizeFamily(entry.family);
      if (family === 'IPv4') {
        ipv4.push(entry.address);
        continue;
      }

      if (family === 'IPv6') {
        ipv6.push(entry.address);
      }
    }
  }

  const bridgeHostIps = [...ipv4, ...ipv6];
  const preferredHostIp = ipv4[0] ?? bridgeHostIps[0];

  return {
    bridgeHostIps,
    ...(preferredHostIp ? { preferredHostIp, runtimeIp: preferredHostIp } : {}),
  };
}
