import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { docusignAuthConfig, validateDocusignAuthConfig } from '@/lib/docusign-auth';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  validateDocusignAuthConfig();

  const state = crypto.randomUUID();

  const authUrl = new URL(`${docusignAuthConfig.authBaseUrl}/oauth/auth`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', docusignAuthConfig.scopes);
  authUrl.searchParams.set('client_id', docusignAuthConfig.clientId);
  authUrl.searchParams.set('redirect_uri', docusignAuthConfig.redirectUri);
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());

  // store state in secure cookie to validate callback
  response.cookies.set('docusign_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return response;
}