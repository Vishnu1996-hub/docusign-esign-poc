import { cookies } from 'next/headers';

export interface DocusignAuthSession {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  baseUri: string;
}

export async function getDocusignSession(): Promise<DocusignAuthSession> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('docusign_access_token')?.value;
  const refreshToken = cookieStore.get('docusign_refresh_token')?.value;
  const accountId = cookieStore.get('docusign_account_id')?.value;
  const baseUri = cookieStore.get('docusign_base_uri')?.value;

  if (!accessToken || !accountId || !baseUri) {
    throw new Error('DocuSign is not connected for this user');
  }

  return {
    accessToken,
    refreshToken,
    accountId,
    baseUri,
  };
}