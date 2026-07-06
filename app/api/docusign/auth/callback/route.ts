import { NextRequest, NextResponse } from 'next/server';
import { docusignAuthConfig, validateDocusignAuthConfig } from '@/lib/docusign-auth';

export const runtime = 'nodejs';

async function exchangeCodeForToken(code: string) {
  const tokenUrl = `${docusignAuthConfig.authBaseUrl}/oauth/token`;

  const basicAuth = Buffer.from(
    `${docusignAuthConfig.clientId}:${docusignAuthConfig.clientSecret}`
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'DocuSign token exchange failed');
  }

  return data;
}

async function getUserInfo(accessToken: string) {
  const response = await fetch(`${docusignAuthConfig.authBaseUrl}/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to fetch DocuSign user info');
  }

  return data;
}

export async function GET(req: NextRequest) {
  validateDocusignAuthConfig();

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Redirects are built from the incoming request's own origin (not a
  // hardcoded APP_BASE_URL env var) so the same code works unmodified on
  // localhost, staging, or production without per-environment upkeep.
  const errorUrl = (message: string) => {
    const url = new URL('/docusign/error', req.url);
    url.searchParams.set('message', message);
    return url;
  };

  if (error) {
    return NextResponse.redirect(errorUrl(errorDescription || error));
  }

  const storedState = req.cookies.get('docusign_oauth_state')?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(errorUrl('Invalid DocuSign OAuth callback state'));
  }

  try {
    const tokenData = await exchangeCodeForToken(code);

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    const userInfo = await getUserInfo(accessToken);

    const account =
      userInfo.accounts.find((acc: { isDefault: string }) => acc.isDefault === 'true') ||
      userInfo.accounts[0];

    if (!account) {
      throw new Error('No DocuSign account found for this user');
    }

    const response = NextResponse.redirect(new URL('/send-envelope', req.url));

    // For POC only: storing in cookies.
    // In enterprise app, store in DB/session store instead.
    response.cookies.set('docusign_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    if (refreshToken) {
      response.cookies.set('docusign_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    response.cookies.set('docusign_account_id', account.account_id || account.accountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set('docusign_base_uri', account.base_uri || account.baseUri, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    // clear state cookie
    response.cookies.set('docusign_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'DocuSign callback failed';
    return NextResponse.redirect(errorUrl(errorMessage));
  }
}