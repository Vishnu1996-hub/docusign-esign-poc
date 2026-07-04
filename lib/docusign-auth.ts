export const docusignAuthConfig = {
  clientId: process.env.DOCUSIGN_CLIENT_ID!,
  clientSecret: process.env.DOCUSIGN_CLIENT_SECRET!,
  authBaseUrl: process.env.DOCUSIGN_AUTH_BASE_URL!,
  redirectUri: process.env.DOCUSIGN_REDIRECT_URI!,
  scopes: process.env.DOCUSIGN_SCOPES || 'signature extended',
};

export function validateDocusignAuthConfig() {
  const required = [
    'DOCUSIGN_CLIENT_ID',
    'DOCUSIGN_CLIENT_SECRET',
    'DOCUSIGN_AUTH_BASE_URL',
    'DOCUSIGN_REDIRECT_URI',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing DocuSign auth env vars: ${missing.join(', ')}`);
  }
}