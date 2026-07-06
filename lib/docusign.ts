import docusign from 'docusign-esign';

export interface DocusignSession {
  apiClient: docusign.ApiClient;
  accountId: string;
}

/**
 * Initializes and returns a fully authenticated Docusign ApiClient instance,
 * along with the accountId resolved from the token (not from env config).
 */
export async function getDocusignClient(): Promise<DocusignSession> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const basePath = process.env.DOCUSIGN_BASE_PATH;
  const rawPrivateKey = process.env.DOCUSIGN_PRIVATE_KEY;

  if (!integrationKey || !userId || !basePath || !rawPrivateKey) {
    throw new Error('Critical Docusign environment configuration variables are missing.');
  }

  const apiClient = new docusign.ApiClient();
  // Only used to pick the correct auth server (demo vs production); the REST
  // basePath used for actual API calls is re-derived below from getUserInfo(),
  // since DocuSign accounts live on different regional clusters (e.g.
  // demo.docusign.net, na2.docusign.net, eu.docusign.net) and the OAuth server
  // response is the only reliable source for that per-account base URI.
  apiClient.setBasePath(basePath);

  // Parse escaped line breaks from environmental string injects safely
  const formattedKey = rawPrivateKey.replace(/\\n/g, '\n');
  const scopes = ['signature', 'impersonation'];
  const tokenExpirationSeconds = 3600;

  try {
    const authResults = await apiClient.requestJWTUserToken(
      integrationKey,
      userId,
      scopes,
      Buffer.from(formattedKey),
      tokenExpirationSeconds
    );

    const accessToken = authResults.body.access_token;
    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

    const userInfo = await apiClient.getUserInfo(accessToken);
    const configuredAccountId = process.env.DOCUSIGN_ACCOUNT_ID;
    const account =
      (configuredAccountId &&
        userInfo.accounts.find((acc: { accountId: string }) => acc.accountId === configuredAccountId)) ||
      userInfo.accounts.find((acc: { isDefault: string }) => acc.isDefault === 'true') ||
      userInfo.accounts[0];

    if (!account) {
      throw new Error('No Docusign account is associated with this user.');
    }

    apiClient.setBasePath(`${account.baseUri}/restapi`);

    return { apiClient, accountId: account.accountId };
    } catch (error: unknown) {
    console.error('\n❌ ===== RAW DOCUSIGN AUTH ERROR PACKET =====');

    // The JWT token request is made with a plain axios call under the hood, so on
    // failure the DocuSign error JSON lives at error.response.data (axios' native
    // shape), not error.response.body (that alias is only added on the success path).
    const docusignErrorBody = (error as { response?: { data?: unknown; body?: unknown } }).response?.data ?? (error as { response?: { data?: unknown; body?: unknown } }).response?.body;

    if (docusignErrorBody) {
      console.error('Error Body:', JSON.stringify(docusignErrorBody, null, 2));
    } else {
      console.error('Raw Error Object:', error);
    }
    console.error('=============================================\n');

    // Extract the exact error message string to show on your screen
    const exactMessage = (docusignErrorBody as { error_description?: string })?.error_description ||
                         (docusignErrorBody as { error?: string })?.error ||
                         (error as { message?: string })?.message;

    throw new Error(`Docusign Identity Server Refusal: ${exactMessage}`);
  }
}