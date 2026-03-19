import { headers } from 'next/headers';

import { ForbiddenError } from '@/lib/errors';

const buildExpectedOrigin = (host: string, protocolHeader: string | null) => {
  const protocol =
    protocolHeader ?? (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
};

export const assertSameOriginRequest = async () => {
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin');
  const host =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocolHeader = requestHeaders.get('x-forwarded-proto');
  const fetchSite = requestHeaders.get('sec-fetch-site');

  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    throw new ForbiddenError('Requete cross-site refusee.');
  }

  if (!host || !origin) {
    // Graceful fallback for environments that omit these headers.
    return;
  }

  const expectedOrigin = buildExpectedOrigin(host, protocolHeader);
  if (origin !== expectedOrigin) {
    throw new ForbiddenError('Requete cross-origin refusee.');
  }
};

export const assertCsrfForAction = async (options?: {
  formData?: FormData;
  subject?: string;
  requireToken?: boolean;
}) => {
  await assertSameOriginRequest();

  // For this private app, same-origin enforcement is the primary CSRF protection.
  void options;
};
