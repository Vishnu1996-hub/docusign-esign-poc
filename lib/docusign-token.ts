import { cookies } from 'next/headers';
import { docusignAuthConfig } from '@/lib/docusign-auth';

export async function refreshDocusignAccessToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('docusign_refresh_token')?.value;

  if (!refreshToken) {
    throw new Error('No DocuSign refresh token available');
  }

  const basicAuth = Buffer.from(
    `${docusignAuthConfig.clientId}:${docusignAuthConfig.clientSecret}`
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${docusignAuthConfig.authBaseUrl}/oauth/token`, {
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
    throw new Error(data.error_description || data.error || 'DocuSign token refresh failed');
  }

  cookieStore.set('docusign_access_token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  if (data.refresh_token) {
    cookieStore.set('docusign_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return data.access_token as string;
}