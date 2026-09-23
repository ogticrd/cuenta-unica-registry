import { getVidFlow } from '@/app/[lang]/vid/flow.action';
import { getCookie } from '@/actions/cookie.action';
import type { CitizenCookie } from '@/types';
import {
  type BiometricSource,
  type BiometricSubject,
  createBiometricSubject,
} from './biometric-state';
import { isBiometricSource } from '@/common/biometric-contract';

export function parseBiometricSource(
  value: unknown,
): BiometricSource | null {
  if (isBiometricSource(value)) {
    return value;
  }

  return null;
}

export async function resolveBiometricSubject({
  source,
  flowId,
  cedulaFromPath,
}: {
  source: BiometricSource;
  flowId?: string;
  cedulaFromPath?: string;
}): Promise<BiometricSubject | null> {
  if (source === 'vid') {
    if (!flowId) {
      return null;
    }

    const flow = await getVidFlow(flowId);

    if (!flow) {
      return null;
    }

    if (cedulaFromPath && flow.cedula !== cedulaFromPath.replace(/\D/g, '')) {
      return null;
    }

    return createBiometricSubject({
      source,
      cedula: flow.cedula,
      flowId,
    });
  }

  const citizen = await getCookie<CitizenCookie>('citizen');

  if (!citizen?.id) {
    return null;
  }

  if (cedulaFromPath && citizen.id !== cedulaFromPath.replace(/\D/g, '')) {
    return null;
  }

  return createBiometricSubject({
    source,
    cedula: citizen.id,
  });
}
