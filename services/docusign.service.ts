import { getValidDocusignToken } from '@/lib/get-valid-docusign-token';

type SendEnvelopePayload = {
  signerName: string;
  signerEmail: string;
  subject: string;
  message?: string;
  documentBase64: string;
  fileName: string;
  // Only set when the caller wants embedded signing for this recipient.
  // DocuSign never emails a recipient that has a clientUserId -- it treats
  // them as "captive" and expects the app to hand them a signing URL itself
  // (see createRecipientView below), so this must stay opt-in.
  clientUserId?: string;
};

type EmbeddedSigningPayload = {
  envelopeId: string;
  signerName: string;
  signerEmail: string;
  clientUserId: string;
  returnUrl: string;
};

async function getDocusignContext() {
  const { accessToken, accountId, baseUri } = await getValidDocusignToken();

  if (!accessToken || !accountId || !baseUri) {
    throw new Error('DocuSign session is not available');
  }

  return { accessToken, accountId, baseUri };
}

export async function sendEnvelope(payload: SendEnvelopePayload) {
  const { accessToken, accountId, baseUri } = await getDocusignContext();

  const requestBody = {
    emailSubject: payload.subject,
    emailBlurb: payload.message || 'Please sign the attached document.',
    documents: [
      {
        documentBase64: payload.documentBase64,
        name: payload.fileName,
        fileExtension: payload.fileName.split('.').pop() || 'pdf',
        documentId: '1',
      },
    ],
    recipients: {
      signers: [
        {
          email: payload.signerEmail,
          name: payload.signerName,
          recipientId: '1',
          routingOrder: '1',
          ...(payload.clientUserId ? { clientUserId: payload.clientUserId } : {}),
          tabs: {
            signHereTabs: [
              {
                anchorString: '/sn1/',
                anchorUnits: 'pixels',
                anchorXOffset: '20',
                anchorYOffset: '10',
              },
            ],
          },
        },
      ],
    },
    status: 'sent',
  };

  const response = await fetch(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || data?.errorCode || 'Failed to send DocuSign envelope'
    );
  }

  return { ...data, clientUserId: payload.clientUserId };
}

export async function createRecipientView(payload: EmbeddedSigningPayload) {
  const { accessToken, accountId, baseUri } = await getDocusignContext();

  const requestBody = {
    returnUrl: payload.returnUrl,
    authenticationMethod: 'none',
    email: payload.signerEmail,
    userName: payload.signerName,
    clientUserId: payload.clientUserId,
  };

  const response = await fetch(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${payload.envelopeId}/views/recipient`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || data?.errorCode || 'Failed to create recipient view'
    );
  }

  return data;
}

export async function getEnvelopeStatus(envelopeId: string) {
  const { accessToken, accountId, baseUri } = await getDocusignContext();

  const response = await fetch(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || data?.errorCode || 'Failed to fetch envelope status'
    );
  }

  return data;
}