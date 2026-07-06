import { getDocusignSession } from '@/lib/docusign-session';

export async function getValidDocusignToken() {
  try {
    const session = await getDocusignSession();
    return {
      accessToken: session.accessToken,
      accountId: session.accountId,
      baseUri: session.baseUri,
    };
  } catch {
    throw new Error('DocuSign session not available');
  }
}