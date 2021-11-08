/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { platform, type, networkInterfaces } from 'os';
import ip from 'ipaddr.js';
import { logger } from '@services/libs/log';

/**
 * Copy from https://github.com/sindresorhus/internal-ip, to fi xsilverwind/default-gateway 's bug
 * @returns
 */
function findIp(gateway: string): string | undefined {
  const gatewayIp = ip.parse(gateway);

  // Look for the matching interface in all local interfaces.
  for (const addresses of Object.values(networkInterfaces())) {
    if (addresses !== undefined) {
      for (const { cidr } of addresses) {
        if (cidr) {
          const net = ip.parseCIDR(cidr);

          // eslint-disable-next-line unicorn/prefer-regexp-test
          if (net[0] && net[0].kind() === gatewayIp.kind() && gatewayIp.match(net)) {
            return net[0].toString();
          }
        }
      }
    }
  }
}

export async function internalIpV4(): Promise<string | undefined> {
  try {
    const defaultGatewayResult = await defaultGatewayV4();
    try {
      logger.debug(`in internalIpV4() defaultGatewayResult is ${defaultGatewayResult ? JSON.stringify(defaultGatewayResult) : 'undefined'}`);
    } catch {}
    if (defaultGatewayResult?.gateway) {
      return findIp(defaultGatewayResult.gateway);
    }
  } catch {}
  logger.warn('In internalIpV4() using fallback');
  return 'localhost';
}

const supportedPlatforms = new Set(['aix', 'android', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32']);

/**
 * Copy from https://github.com/silverwind/default-gateway 's index.js, to fix its weird behavior on windows. Its require statement will always require
 * @returns
 */
async function defaultGatewayV4(): Promise<IDefaultGatewayInfo | undefined> {
  const plat = platform();

  if (supportedPlatforms.has(plat)) {
    let gatewayQueryFileName: NodeJS.Platform | 'ibmi' = plat;
    if (plat === 'aix') {
      gatewayQueryFileName = type() === 'OS400' ? 'ibmi' : 'sunos'; // AIX `netstat` output is compatible with Solaris
    }

    logger.debug(`in defaultGatewayV4() plat is ${plat} , so gatewayQueryFileName is ${gatewayQueryFileName}`);

    switch (gatewayQueryFileName) {
      case 'ibmi': {
        const defaultGateway = await import('default-gateway/ibmi');
        return await defaultGateway.v4();
      }
      case 'android': {
        const defaultGateway = await import('default-gateway/android');
        return await defaultGateway.v4();
      }
      case 'darwin': {
        const defaultGateway = await import('default-gateway/darwin');
        return await defaultGateway.v4();
      }
      case 'freebsd': {
        const defaultGateway = await import('default-gateway/freebsd');
        return await defaultGateway.v4();
      }
      case 'linux': {
        const defaultGateway = await import('default-gateway/linux');
        return await defaultGateway.v4();
      }
      case 'openbsd': {
        const defaultGateway = await import('default-gateway/openbsd');
        return await defaultGateway.v4();
      }
      case 'sunos': {
        const defaultGateway = await import('default-gateway/sunos');
        return await defaultGateway.v4();
      }
      case 'win32': {
        const defaultGateway = await import('default-gateway/win32');
        return await defaultGateway.v4();
      }
    }
  }
}