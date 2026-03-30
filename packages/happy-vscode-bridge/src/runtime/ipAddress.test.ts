import { describe, expect, it } from 'vitest';

import { detectHostIpInfo } from './ipAddress';

describe('detectHostIpInfo', () => {
  it('prefers non-internal IPv4 addresses when available', () => {
    const info = detectHostIpInfo(() => ({
      lo: [
        {
          address: '127.0.0.1',
          family: 'IPv4',
          internal: true,
          netmask: '255.0.0.0',
          cidr: '127.0.0.1/8',
          mac: '00:00:00:00:00:00',
        },
      ],
      eth0: [
        {
          address: '10.0.0.2',
          family: 'IPv4',
          internal: false,
          netmask: '255.255.255.0',
          cidr: '10.0.0.2/24',
          mac: '00:11:22:33:44:55',
        },
        {
          address: 'fe80::1',
          family: 'IPv6',
          internal: false,
          netmask: 'ffff:ffff:ffff:ffff::',
          cidr: 'fe80::1/64',
          mac: '00:11:22:33:44:55',
          scopeid: 1,
        },
      ],
    }));

    expect(info.bridgeHostIps).toEqual(['10.0.0.2', 'fe80::1']);
    expect(info.preferredHostIp).toBe('10.0.0.2');
    expect(info.runtimeIp).toBe('10.0.0.2');
  });
});
