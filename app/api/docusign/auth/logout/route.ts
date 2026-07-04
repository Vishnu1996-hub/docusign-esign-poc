import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SESSION_COOKIES = [
  'docusign_access_token',
  'docusign_refresh_token',
  'docusign_account_id',
  'docusign_base_uri',
];

/**
 * Ends the DocuSign Authorization Code Grant session for this browser by
 * clearing the cookies set in auth/callback. This only forgets the local
 * session cookie -- it does not revoke the token with DocuSign -- which is
 * sufficient for a POC where the same user reconnects via /api/docusign/auth/login.
 */
export async function GET(req: NextRequest) {
  const homeUrl = new URL('/', req.url);
  const response = NextResponse.redirect(homeUrl);

  for (const name of SESSION_COOKIES) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}
